from apps.common.enums import LeagueFormat, MatchStatus
from apps.leagues.models import League
from apps.matches.models import Match


def generate_pairings(team_ids: list[int]) -> list[tuple[int, int]]:
    """Circle method round-robin pairings (home, away) per round."""
    teams = list(team_ids)
    if len(teams) < 2:
        return []

    # Pad with None for odd team count (BYE)
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
            # Alternate home/away for fairness across rounds
            if round_idx % 2 == 0:
                pairings.append((home, away))
            else:
                pairings.append((away, home))
        # Rotate all except first team
        teams = [teams[0]] + [teams[-1]] + teams[1:-1]

    return pairings


def generate_fixtures(league: League) -> list[Match]:
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

    return Match.objects.bulk_create(matches)
