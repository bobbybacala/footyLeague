from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.leagues.models import League
from apps.matches.models import Match
from apps.matches.serializers import (
    CardSerializer,
    GoalSerializer,
    MatchSerializer,
)
from apps.matches.services import (
    MatchServiceError,
    add_goal,
    add_red_card,
    add_yellow_card,
    end_match,
    start_match,
)


class MatchDetailView(generics.RetrieveAPIView):
    queryset = Match.objects.select_related(
        "home_team", "away_team"
    ).prefetch_related("events__player", "events__assist_player", "events__team")
    serializer_class = MatchSerializer


class LeagueMatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer

    def get_queryset(self):
        league = get_object_or_404(League, pk=self.kwargs["league_pk"])
        qs = (
            Match.objects.filter(league=league)
            .select_related("home_team", "away_team")
            .prefetch_related("events__player", "events__assist_player", "events__team")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class StartMatchView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        try:
            start_match(match)
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MatchSerializer(match).data)


class GoalView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = GoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            add_goal(
                match,
                scorer_id=serializer.validated_data["scorer_id"],
                assist_id=serializer.validated_data.get("assist_id"),
            )
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)


class YellowCardView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = CardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            add_yellow_card(match, player_id=serializer.validated_data["player_id"])
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)


class RedCardView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = CardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            add_red_card(match, player_id=serializer.validated_data["player_id"])
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)


class EndMatchView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        try:
            end_match(match)
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)
