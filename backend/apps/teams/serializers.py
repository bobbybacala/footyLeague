from rest_framework import serializers

from apps.common.enums import LeagueStatus
from apps.teams.models import Team


class TeamSerializer(serializers.ModelSerializer):
    player_count = serializers.SerializerMethodField()
    captain_name = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "league",
            "name",
            "logo",
            "jersey_color",
            "created_at",
            "player_count",
            "captain_name",
        ]
        read_only_fields = ["id", "league", "created_at", "player_count", "captain_name"]

    def get_player_count(self, obj):
        return obj.players.count()

    def get_captain_name(self, obj):
        captain = obj.players.filter(is_captain=True).first()
        return captain.name if captain else None

    def validate_name(self, value):
        league = self.context.get("league")
        if league is None:
            return value
        qs = Team.objects.filter(league=league, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A team with this name already exists in the league."
            )
        return value

    def validate(self, attrs):
        league = self.context.get("league")
        if league and league.status == LeagueStatus.COMPLETED:
            raise serializers.ValidationError(
                "Cannot modify teams in a completed league."
            )
        return attrs
