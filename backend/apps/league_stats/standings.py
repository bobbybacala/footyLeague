from apps.common.enums import MatchStatus
from apps.leagues.models import League
from apps.teams.models import Team


def compute_standings(league: League) -> list[dict]:
    teams = Team.objects.filter(league=league)
    standings_map = {
        team.id: {
            "team_id": team.id,
            "team_name": team.name,
            "played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_for": 0,
            "goals_against": 0,
            "goal_difference": 0,
            "points": 0,
        }
        for team in teams
    }

    finished_matches = league.matches.filter(status=MatchStatus.FINISHED).select_related(
        "home_team", "away_team"
    )

    for match in finished_matches:
        home = standings_map[match.home_team_id]
        away = standings_map[match.away_team_id]

        home["played"] += 1
        away["played"] += 1
        home["goals_for"] += match.home_score
        home["goals_against"] += match.away_score
        away["goals_for"] += match.away_score
        away["goals_against"] += match.home_score

        if match.home_score > match.away_score:
            home["wins"] += 1
            home["points"] += 3
            away["losses"] += 1
        elif match.home_score < match.away_score:
            away["wins"] += 1
            away["points"] += 3
            home["losses"] += 1
        else:
            home["draws"] += 1
            away["draws"] += 1
            home["points"] += 1
            away["points"] += 1

    standings = list(standings_map.values())
    for row in standings:
        row["goal_difference"] = row["goals_for"] - row["goals_against"]

    standings.sort(
        key=lambda r: (
            -r["points"],
            -r["goal_difference"],
            -r["goals_for"],
            r["team_name"].lower(),
        )
    )

    for idx, row in enumerate(standings, start=1):
        row["position"] = idx

    return standings
