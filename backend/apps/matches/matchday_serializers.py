from rest_framework import serializers

from apps.common.enums import MatchStatus
from apps.leagues.models import League
from apps.matches.models import Match, Matchday, MatchdayFixture
from apps.matches.serializers import MatchSerializer


class MatchdaySerializer(serializers.ModelSerializer):
    matches = serializers.SerializerMethodField()

    class Meta:
        model = Matchday
        fields = ["id", "league", "title", "date", "created_at", "matches"]
        read_only_fields = ["id", "league", "created_at", "matches"]

    def get_matches(self, obj: Matchday) -> list:
        matches = (
            Match.objects.filter(matchday_fixture__matchday=obj)
            .select_related("home_team", "away_team")
            .prefetch_related("events__player", "events__assist_player", "events__team")
            .order_by("id")
        )
        return MatchSerializer(matches, many=True).data


class MatchdayCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    date = serializers.DateField()
    match_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, min_length=1
    )

    def validate_match_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate matches are not allowed.")
        return value

    def validate(self, attrs):
        league: League = self.context["league"]
        match_ids = attrs["match_ids"]

        matches = list(
            Match.objects.filter(league=league, id__in=match_ids).select_related(
                "home_team", "away_team"
            )
        )
        if len(matches) != len(match_ids):
            raise serializers.ValidationError(
                {"match_ids": "One or more matches were not found in this league."}
            )

        invalid_status = [m.id for m in matches if m.status != MatchStatus.PENDING]
        if invalid_status:
            raise serializers.ValidationError(
                {"match_ids": "Only pending matches can be added to a matchday."}
            )

        already_assigned = MatchdayFixture.objects.filter(
            match_id__in=match_ids
        ).values_list("match_id", flat=True)
        if already_assigned:
            raise serializers.ValidationError(
                {"match_ids": "One or more matches are already assigned to a matchday."}
            )

        attrs["matches"] = matches
        return attrs

    def create(self, validated_data):
        league = self.context["league"]
        matches = validated_data.pop("matches")
        matchday = Matchday.objects.create(
            league=league,
            title=validated_data["title"],
            date=validated_data["date"],
        )
        MatchdayFixture.objects.bulk_create(
            [MatchdayFixture(matchday=matchday, match=m) for m in matches]
        )
        return matchday
