from rest_framework import serializers

from apps.teams.models import Team


class TeamSerializer(serializers.ModelSerializer):
    player_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ["id", "league", "name", "logo", "created_at", "player_count"]
        read_only_fields = ["id", "league", "created_at", "player_count"]

    def get_player_count(self, obj):
        return obj.players.count()

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
