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
    MatchUpdateSerializer,
    StartMatchSerializer,
)
from apps.matches.services import (
    MatchServiceError,
    add_goal,
    add_red_card,
    add_yellow_card,
    delete_match,
    end_match,
    remove_event,
    start_match,
    undo_last_event,
)


class MatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Match.objects.select_related(
        "home_team", "away_team"
    ).prefetch_related("events__player", "events__assist_player", "events__team")
    serializer_class = MatchSerializer

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return MatchUpdateSerializer
        return MatchSerializer

    def perform_destroy(self, instance):
        try:
            delete_match(instance)
        except MatchServiceError as exc:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(str(exc)) from exc


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
        match = get_object_or_404(
            Match.objects.select_related("home_team", "away_team"), pk=pk
        )
        serializer = StartMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            start_match(
                match,
                home_jersey_color=serializer.validated_data.get("home_jersey_color")
                or None,
                away_jersey_color=serializer.validated_data.get("away_jersey_color")
                or None,
            )
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


class UndoLastEventView(APIView):
    def post(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        try:
            undo_last_event(match)
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)


class RemoveEventView(APIView):
    def post(self, request, pk, event_pk):
        match = get_object_or_404(Match, pk=pk)
        event = get_object_or_404(match.events, pk=event_pk)
        try:
            remove_event(event)
        except MatchServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        match.refresh_from_db()
        return Response(MatchSerializer(match).data)
