from rest_framework import serializers

from apps.common.enums import LeagueStatus, PlayerPosition
from apps.matches.models import MatchEvent
from apps.players.models import Player


class PlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source="team.name", read_only=True)
    has_match_history = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            "id",
            "team",
            "team_name",
            "name",
            "position",
            "is_captain",
            "is_vice_captain",
            "is_inactive",
            "goals",
            "assists",
            "yellow_cards",
            "red_cards",
            "clean_sheets",
            "has_match_history",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "team",
            "team_name",
            "goals",
            "assists",
            "yellow_cards",
            "red_cards",
            "clean_sheets",
            "has_match_history",
            "created_at",
        ]

    def get_has_match_history(self, obj):
        return MatchEvent.objects.filter(player=obj).exists()

    def validate_position(self, value):
        if value not in PlayerPosition.values:
            raise serializers.ValidationError("Invalid position.")
        return value

    def validate(self, attrs):
        team = self.context.get("team") or (self.instance.team if self.instance else None)
        league = team.league if team else None

        if league and league.status == LeagueStatus.COMPLETED:
            raise serializers.ValidationError("Cannot modify players in a completed league.")

        if self.instance and "name" not in attrs and not attrs:
            return attrs

        if (
            self.instance
            and league
            and league.status != LeagueStatus.DRAFT
            and self.context.get("request")
            and self.context["request"].method == "DELETE"
        ):
            if self.get_has_match_history(self.instance):
                raise serializers.ValidationError(
                    "Cannot delete a player with match history. Mark them as inactive instead."
                )

        position = attrs.get("position")
        if position is None and self.instance:
            position = self.instance.position
        if team and position == PlayerPosition.GOALKEEPER:
            existing = Player.objects.filter(
                team=team, position=PlayerPosition.GOALKEEPER
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {"position": "This team already has a goalkeeper."}
                )

        return attrs

    def create(self, validated_data):
        team = validated_data.get("team") or self.context["team"]
        if validated_data.get("is_captain"):
            Player.objects.filter(team=team, is_captain=True).update(is_captain=False)
        if validated_data.get("is_vice_captain"):
            Player.objects.filter(team=team, is_vice_captain=True).update(
                is_vice_captain=False
            )
        if "team" not in validated_data:
            validated_data["team"] = team
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_captain"):
            Player.objects.filter(team=instance.team, is_captain=True).exclude(
                pk=instance.pk
            ).update(is_captain=False)
        if validated_data.get("is_vice_captain"):
            Player.objects.filter(team=instance.team, is_vice_captain=True).exclude(
                pk=instance.pk
            ).update(is_vice_captain=False)
        if validated_data.get("is_captain") and validated_data.get("is_vice_captain"):
            validated_data["is_vice_captain"] = False
        if (
            validated_data.get("is_vice_captain")
            and instance.is_captain
            and "is_captain" not in validated_data
        ):
            validated_data["is_captain"] = False
        if (
            validated_data.get("is_captain")
            and instance.is_vice_captain
            and "is_vice_captain" not in validated_data
        ):
            validated_data["is_vice_captain"] = False
        return super().update(instance, validated_data)
