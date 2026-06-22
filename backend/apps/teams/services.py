from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from apps.common.enums import LeagueStatus, MatchStatus
from apps.fixtures.services import add_fixtures_for_new_team
from apps.leagues.models import League
from apps.matches.models import Match
from apps.matches.services import recalculate_league_player_stats
from apps.teams.models import Team


@transaction.atomic
def create_team_with_fixtures(league: League, team: Team) -> list[Match]:
    if league.status != LeagueStatus.DRAFT:
        return add_fixtures_for_new_team(league, team.id)
    return []


@transaction.atomic
def delete_team(team: Team) -> None:
    league = team.league

    if league.status == LeagueStatus.COMPLETED:
        raise ValidationError("Cannot delete teams in a completed league.")

    team_matches = Match.objects.filter(league=league).filter(
        Q(home_team=team) | Q(away_team=team)
    )

    if team_matches.filter(status=MatchStatus.LIVE).exists():
        raise ValidationError("Cannot delete a team with a live match in progress.")

    team_matches.delete()
    team.delete()
    recalculate_league_player_stats(league.id)

    if league.status == LeagueStatus.COMPLETED:
        league.status = LeagueStatus.ACTIVE
        league.save(update_fields=["status"])
