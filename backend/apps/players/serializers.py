from rest_framework import serializers

from apps.common.enums import PlayerPosition
from apps.players.models import Player


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = [
            "id",
            "team",
            "name",
            "position",
            "is_captain",
            "goals",
            "assists",
            "yellow_cards",
            "red_cards",
            "clean_sheets",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "team",
            "goals",
            "assists",
            "yellow_cards",
            "red_cards",
            "clean_sheets",
            "created_at",
        ]

    def validate_position(self, value):
        if value not in PlayerPosition.values:
            raise serializers.ValidationError("Invalid position.")
        return value

    def create(self, validated_data):
        team = validated_data.get("team") or self.context["team"]
        if validated_data.get("is_captain"):
            Player.objects.filter(team=team, is_captain=True).update(
                is_captain=False
            )
        if "team" not in validated_data:
            validated_data["team"] = team
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_captain"):
            Player.objects.filter(team=instance.team, is_captain=True).exclude(
                pk=instance.pk
            ).update(is_captain=False)
        return super().update(instance, validated_data)
