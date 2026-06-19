from rest_framework import serializers

from apps.leagues.models import League


class LeagueSerializer(serializers.ModelSerializer):
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = [
            "id",
            "name",
            "venue",
            "format",
            "created_at",
            "team_count",
        ]
        read_only_fields = ["id", "created_at", "team_count"]

    def get_team_count(self, obj):
        return obj.teams.count()
