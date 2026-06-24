from apps.common.enums import LeagueFormat, LeagueStatus, MatchStatus
from apps.leagues.models import League
from apps.matches.models import Match


def count_fixtures(league: League) -> int:
    teams = list(league.teams.values_list("id", flat=True))
    if len(teams) < 2:
        return 0
    count = len(generate_pairings(teams))
    if league.format == LeagueFormat.DOUBLE_ROUND_ROBIN:
        count *= 2
    return count


def generate_pairings(team_ids: list[int]) -> list[tuple[int, int]]:
    """Circle method round-robin pairings (home, away) per round."""
    teams = list(team_ids)
    if len(teams) < 2:
        return []

    if len(teams) % 2 == 1:
        teams.append(None)

    n = len(teams)
    rounds = n - 1
    half = n // 2
    pairings = []

    for round_idx in range(rounds):
        for i in range(half):
            home = teams[i]
            away = teams[n - 1 - i]
            if home is None or away is None:
                continue
            if round_idx % 2 == 0:
                pairings.append((home, away))
            else:
                pairings.append((away, home))
        teams = [teams[0]] + [teams[-1]] + teams[1:-1]

    return pairings


def generate_fixtures(league: League) -> list[Match]:
    if league.status != LeagueStatus.DRAFT:
        raise ValueError("Fixtures can only be generated for leagues in DRAFT status.")

    teams = list(league.teams.values_list("id", flat=True))
    if len(teams) < 2:
        raise ValueError("At least 2 teams are required to generate fixtures.")

    if league.matches.exists():
        raise ValueError("Fixtures already exist for this league.")

    pairings = generate_pairings(teams)

    if league.format == LeagueFormat.DOUBLE_ROUND_ROBIN:
        reversed_pairings = [(away, home) for home, away in pairings]
        pairings = pairings + reversed_pairings

    matches = []
    for home_id, away_id in pairings:
        matches.append(
            Match(
                league=league,
                home_team_id=home_id,
                away_team_id=away_id,
                status=MatchStatus.PENDING,
            )
        )

    created = Match.objects.bulk_create(matches)
    league.status = LeagueStatus.ACTIVE
    league.save(update_fields=["status"])
    return created


def _match_exists(league: League, home_id: int, away_id: int) -> bool:
    return Match.objects.filter(
        league=league, home_team_id=home_id, away_team_id=away_id
    ).exists()


def add_fixtures_for_new_team(league: League, new_team_id: int) -> list[Match]:
    """Create pending fixtures between a new team and all existing teams."""
    if league.status == LeagueStatus.DRAFT:
        return []

    existing_team_ids = list(
        league.teams.exclude(pk=new_team_id).values_list("id", flat=True)
    )
    if not existing_team_ids:
        return []

    to_create: list[Match] = []
    for other_id in existing_team_ids:
        pairings = [(new_team_id, other_id)]
        if league.format == LeagueFormat.DOUBLE_ROUND_ROBIN:
            pairings.append((other_id, new_team_id))

        for home_id, away_id in pairings:
            if not _match_exists(league, home_id, away_id):
                to_create.append(
                    Match(
                        league=league,
                        home_team_id=home_id,
                        away_team_id=away_id,
                        status=MatchStatus.PENDING,
                    )
                )

    if not to_create:
        return []

    created = Match.objects.bulk_create(to_create)
    if league.status == LeagueStatus.COMPLETED:
        league.status = LeagueStatus.ACTIVE
        league.save(update_fields=["status"])
    return created
