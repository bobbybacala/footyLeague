from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.common.enums import LeagueStatus, MatchEventType, MatchStatus, PlayerPosition
from apps.leagues.models import League
from apps.matches.models import Match, MatchEvent
from apps.players.models import Player


class MatchServiceError(Exception):
    pass


def _validate_editable(match: Match):
    if match.status not in (MatchStatus.LIVE, MatchStatus.FINISHED):
        raise MatchServiceError("Events can only be recorded on live or finished matches.")


def _validate_live(match: Match):
    if match.status != MatchStatus.LIVE:
        raise MatchServiceError("Match must be LIVE to record events.")


def _validate_player_on_match(match: Match, player: Player):
    if player.team_id not in (match.home_team_id, match.away_team_id):
        raise MatchServiceError("Player does not belong to either team in this match.")


def _recompute_scores(match: Match):
    home_goals = match.events.filter(
        event_type=MatchEventType.GOAL, team_id=match.home_team_id
    ).count()
    away_goals = match.events.filter(
        event_type=MatchEventType.GOAL, team_id=match.away_team_id
    ).count()
    match.home_score = home_goals
    match.away_score = away_goals
    match.save(update_fields=["home_score", "away_score"])


def _check_league_completed(league: League):
    if not league.matches.filter(status=MatchStatus.PENDING).exists() and not league.matches.filter(
        status=MatchStatus.LIVE
    ).exists():
        if league.matches.filter(status=MatchStatus.FINISHED).exists():
            league.status = LeagueStatus.COMPLETED
            league.save(update_fields=["status"])


@transaction.atomic
def recalculate_league_player_stats(league_id: int):
    Player.objects.filter(team__league_id=league_id).update(
        goals=0,
        assists=0,
        yellow_cards=0,
        red_cards=0,
        clean_sheets=0,
    )

    finished_matches = Match.objects.filter(
        league_id=league_id, status=MatchStatus.FINISHED
    ).prefetch_related("events")

    live_matches = Match.objects.filter(
        league_id=league_id, status=MatchStatus.LIVE
    ).prefetch_related("events")

    for match in list(finished_matches) + list(live_matches):
        for event in match.events.all():
            if event.event_type == MatchEventType.GOAL:
                Player.objects.filter(pk=event.player_id).update(
                    goals=F("goals") + 1
                )
                if event.assist_player_id:
                    Player.objects.filter(pk=event.assist_player_id).update(
                        assists=F("assists") + 1
                    )
            elif event.event_type == MatchEventType.YELLOW_CARD:
                Player.objects.filter(pk=event.player_id).update(
                    yellow_cards=F("yellow_cards") + 1
                )
            elif event.event_type == MatchEventType.RED_CARD:
                Player.objects.filter(pk=event.player_id).update(
                    red_cards=F("red_cards") + 1
                )

    for match in finished_matches:
        if match.away_score == 0:
            Player.objects.filter(
                team=match.home_team, position=PlayerPosition.GOALKEEPER
            ).update(clean_sheets=F("clean_sheets") + 1)
        if match.home_score == 0:
            Player.objects.filter(
                team=match.away_team, position=PlayerPosition.GOALKEEPER
            ).update(clean_sheets=F("clean_sheets") + 1)


@transaction.atomic
def start_match(
    match: Match,
    home_jersey_color: str | None = None,
    away_jersey_color: str | None = None,
) -> Match:
    if match.status != MatchStatus.PENDING:
        raise MatchServiceError("Only PENDING matches can be started.")
    match.home_jersey_color = home_jersey_color or match.home_team.jersey_color
    match.away_jersey_color = away_jersey_color or match.away_team.jersey_color
    match.status = MatchStatus.LIVE
    match.started_at = timezone.now()
    match.save(
        update_fields=[
            "home_jersey_color",
            "away_jersey_color",
            "status",
            "started_at",
        ]
    )
    return match


@transaction.atomic
def add_goal(match: Match, scorer_id: int, assist_id: int | None = None) -> MatchEvent:
    _validate_editable(match)
    scorer = Player.objects.select_for_update().get(pk=scorer_id)
    _validate_player_on_match(match, scorer)

    assist_player = None
    if assist_id is not None:
        if assist_id == scorer_id:
            raise MatchServiceError("Scorer cannot assist their own goal.")
        assist_player = Player.objects.select_for_update().get(pk=assist_id)
        _validate_player_on_match(match, assist_player)
        if assist_player.team_id != scorer.team_id:
            raise MatchServiceError("Assist must come from the same team as the scorer.")

    event = MatchEvent.objects.create(
        match=match,
        event_type=MatchEventType.GOAL,
        player=scorer,
        assist_player=assist_player,
        team=scorer.team,
    )

    if match.status == MatchStatus.LIVE:
        Player.objects.filter(pk=scorer.pk).update(goals=F("goals") + 1)
        if assist_player:
            Player.objects.filter(pk=assist_player.pk).update(assists=F("assists") + 1)
    else:
        recalculate_league_player_stats(match.league_id)

    _recompute_scores(match)
    return event


@transaction.atomic
def add_yellow_card(match: Match, player_id: int) -> MatchEvent:
    _validate_editable(match)
    player = Player.objects.select_for_update().get(pk=player_id)
    _validate_player_on_match(match, player)

    event = MatchEvent.objects.create(
        match=match,
        event_type=MatchEventType.YELLOW_CARD,
        player=player,
        team=player.team,
    )
    if match.status == MatchStatus.LIVE:
        Player.objects.filter(pk=player.pk).update(yellow_cards=F("yellow_cards") + 1)
    else:
        recalculate_league_player_stats(match.league_id)
    return event


@transaction.atomic
def add_red_card(match: Match, player_id: int) -> MatchEvent:
    _validate_editable(match)
    player = Player.objects.select_for_update().get(pk=player_id)
    _validate_player_on_match(match, player)

    event = MatchEvent.objects.create(
        match=match,
        event_type=MatchEventType.RED_CARD,
        player=player,
        team=player.team,
    )
    if match.status == MatchStatus.LIVE:
        Player.objects.filter(pk=player.pk).update(red_cards=F("red_cards") + 1)
    else:
        recalculate_league_player_stats(match.league_id)
    return event


@transaction.atomic
def remove_event(event: MatchEvent) -> Match:
    match = Match.objects.select_for_update().get(pk=event.match_id)
    _validate_editable(match)
    event.delete()
    _recompute_scores(match)
    recalculate_league_player_stats(match.league_id)
    return match


@transaction.atomic
def undo_last_event(match: Match) -> Match:
    _validate_live(match)
    last_event = match.events.order_by("-created_at", "-id").first()
    if not last_event:
        raise MatchServiceError("No events to undo.")

    if last_event.event_type == MatchEventType.GOAL:
        Player.objects.filter(pk=last_event.player_id).update(goals=F("goals") - 1)
        if last_event.assist_player_id:
            Player.objects.filter(pk=last_event.assist_player_id).update(
                assists=F("assists") - 1
            )
    elif last_event.event_type == MatchEventType.YELLOW_CARD:
        Player.objects.filter(pk=last_event.player_id).update(
            yellow_cards=F("yellow_cards") - 1
        )
    elif last_event.event_type == MatchEventType.RED_CARD:
        Player.objects.filter(pk=last_event.player_id).update(
            red_cards=F("red_cards") - 1
        )

    last_event.delete()
    _recompute_scores(match)
    return match


@transaction.atomic
def delete_match(match: Match) -> Match | None:
    if match.status == MatchStatus.LIVE:
        raise MatchServiceError(
            "Cannot delete a live match. Finish the match or undo all events first."
        )
    if match.status == MatchStatus.PENDING:
        raise MatchServiceError("Upcoming matches cannot be deleted.")

    if match.status == MatchStatus.FINISHED:
        league = match.league
        match.events.all().delete()
        match.home_score = 0
        match.away_score = 0
        match.status = MatchStatus.PENDING
        match.started_at = None
        match.ended_at = None
        match.save(
            update_fields=[
                "home_score",
                "away_score",
                "status",
                "started_at",
                "ended_at",
            ]
        )
        recalculate_league_player_stats(match.league_id)
        if league.status == LeagueStatus.COMPLETED:
            league.status = LeagueStatus.ACTIVE
            league.save(update_fields=["status"])
        return match

    league_id = match.league_id
    match.delete()
    recalculate_league_player_stats(league_id)
    return None


@transaction.atomic
def end_match(match: Match) -> Match:
    _validate_live(match)
    match.status = MatchStatus.FINISHED
    match.ended_at = timezone.now()
    match.save(update_fields=["status", "ended_at"])

    recalculate_league_player_stats(match.league_id)
    _check_league_completed(match.league)
    return match
