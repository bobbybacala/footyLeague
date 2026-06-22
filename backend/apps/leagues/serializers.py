from rest_framework import serializers

from apps.leagues.models import League


class LeagueSerializer(serializers.ModelSerializer):
    team_count = serializers.SerializerMethodField()
    player_count = serializers.SerializerMethodField()
    matches_played = serializers.SerializerMethodField()
    matches_remaining = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = [
            "id",
            "name",
            "venue",
            "format",
            "status",
            "points_win",
            "points_draw",
            "created_at",
            "team_count",
            "player_count",
            "matches_played",
            "matches_remaining",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "team_count",
            "player_count",
            "matches_played",
            "matches_remaining",
        ]

    def validate(self, attrs):
        if self.instance and self.instance.status != "DRAFT":
            disallowed = {"format", "points_win", "points_draw", "status"} & attrs.keys()
            if disallowed:
                raise serializers.ValidationError(
                    "Only league name and venue can be changed after setup."
                )
        return attrs

    def get_team_count(self, obj):
        return obj.teams.count()

    def get_player_count(self, obj):
        from apps.players.models import Player

        return Player.objects.filter(team__league=obj).count()

    def get_matches_played(self, obj):
        from apps.common.enums import MatchStatus

        return obj.matches.filter(status=MatchStatus.FINISHED).count()

    def get_matches_remaining(self, obj):
        from apps.common.enums import MatchStatus

        return obj.matches.filter(
            status__in=(MatchStatus.PENDING, MatchStatus.LIVE)
        ).count()
