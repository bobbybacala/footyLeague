from apps.common.enums import PlayerPosition
from apps.leagues.models import League
from apps.players.models import Player


def _top_leaders(players, stat_field: str) -> list[dict]:
    if not players:
        return []

    max_value = max(getattr(p, stat_field) for p in players)
    if max_value == 0:
        return []

    leaders = [p for p in players if getattr(p, stat_field) == max_value]
    return [
        {
            "player_id": p.id,
            "player_name": p.name,
            "team_name": p.team.name,
            "value": getattr(p, stat_field),
        }
        for p in leaders
    ]


def compute_awards(league: League) -> dict:
    players = (
        Player.objects.filter(team__league=league)
        .select_related("team")
        .order_by("name")
    )
    player_list = list(players)
    goalkeepers = [p for p in player_list if p.position == PlayerPosition.GOALKEEPER]

    return {
        "top_scorer": _top_leaders(player_list, "goals"),
        "top_assister": _top_leaders(player_list, "assists"),
        "most_clean_sheets": _top_leaders(goalkeepers, "clean_sheets"),
    }
