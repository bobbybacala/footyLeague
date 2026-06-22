from rest_framework import serializers

from apps.matches.models import Match, MatchEvent
from apps.players.serializers import PlayerSerializer


class MatchEventSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source="player.name", read_only=True)
    assist_player_name = serializers.CharField(
        source="assist_player.name", read_only=True, default=None
    )
    team_name = serializers.CharField(source="team.name", read_only=True)

    class Meta:
        model = MatchEvent
        fields = [
            "id",
            "event_type",
            "player",
            "player_name",
            "assist_player",
            "assist_player_name",
            "team",
            "team_name",
            "created_at",
        ]


class MatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source="home_team.name", read_only=True)
    away_team_name = serializers.CharField(source="away_team.name", read_only=True)
    events = MatchEventSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = [
            "id",
            "league",
            "home_team",
            "away_team",
            "home_team_name",
            "away_team_name",
            "home_score",
            "away_score",
            "status",
            "scheduled_date",
            "started_at",
            "ended_at",
            "home_jersey_color",
            "away_jersey_color",
            "events",
        ]


class MatchUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ["home_jersey_color", "away_jersey_color"]


class StartMatchSerializer(serializers.Serializer):
    home_jersey_color = serializers.RegexField(
        r"^#[0-9A-Fa-f]{6}$", required=False, allow_blank=True
    )
    away_jersey_color = serializers.RegexField(
        r"^#[0-9A-Fa-f]{6}$", required=False, allow_blank=True
    )


class GoalSerializer(serializers.Serializer):
    scorer_id = serializers.IntegerField()
    assist_id = serializers.IntegerField(required=False, allow_null=True)


class CardSerializer(serializers.Serializer):
    player_id = serializers.IntegerField()
