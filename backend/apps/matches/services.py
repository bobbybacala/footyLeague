from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.common.enums import MatchEventType, MatchStatus, PlayerPosition
from apps.matches.models import Match, MatchEvent
from apps.players.models import Player


class MatchServiceError(Exception):
    pass


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


@transaction.atomic
def start_match(match: Match) -> Match:
    if match.status != MatchStatus.PENDING:
        raise MatchServiceError("Only PENDING matches can be started.")
    match.status = MatchStatus.LIVE
    match.started_at = timezone.now()
    match.save(update_fields=["status", "started_at"])
    return match


@transaction.atomic
def add_goal(match: Match, scorer_id: int, assist_id: int | None = None) -> MatchEvent:
    _validate_live(match)
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

    Player.objects.filter(pk=scorer.pk).update(goals=F("goals") + 1)
    if assist_player:
        Player.objects.filter(pk=assist_player.pk).update(assists=F("assists") + 1)

    _recompute_scores(match)
    return event


@transaction.atomic
def add_yellow_card(match: Match, player_id: int) -> MatchEvent:
    _validate_live(match)
    player = Player.objects.select_for_update().get(pk=player_id)
    _validate_player_on_match(match, player)

    event = MatchEvent.objects.create(
        match=match,
        event_type=MatchEventType.YELLOW_CARD,
        player=player,
        team=player.team,
    )
    Player.objects.filter(pk=player.pk).update(yellow_cards=F("yellow_cards") + 1)
    return event


@transaction.atomic
def add_red_card(match: Match, player_id: int) -> MatchEvent:
    _validate_live(match)
    player = Player.objects.select_for_update().get(pk=player_id)
    _validate_player_on_match(match, player)

    event = MatchEvent.objects.create(
        match=match,
        event_type=MatchEventType.RED_CARD,
        player=player,
        team=player.team,
    )
    Player.objects.filter(pk=player.pk).update(red_cards=F("red_cards") + 1)
    return event


@transaction.atomic
def end_match(match: Match) -> Match:
    _validate_live(match)
    match.status = MatchStatus.FINISHED
    match.ended_at = timezone.now()
    match.save(update_fields=["status", "ended_at"])

    # Clean sheets for goalkeepers who conceded zero goals
    if match.away_score == 0:
        Player.objects.filter(
            team=match.home_team, position=PlayerPosition.GOALKEEPER
        ).update(clean_sheets=F("clean_sheets") + 1)
    if match.home_score == 0:
        Player.objects.filter(
            team=match.away_team, position=PlayerPosition.GOALKEEPER
        ).update(clean_sheets=F("clean_sheets") + 1)

    return match
