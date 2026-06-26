from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response

from apps.leagues.models import League
from apps.matches.matchday_serializers import MatchdayCreateSerializer, MatchdaySerializer
from apps.matches.models import Matchday


class LeagueMatchdayListCreateView(generics.ListCreateAPIView):
    serializer_class = MatchdaySerializer

    def get_queryset(self):
        league = get_object_or_404(League, pk=self.kwargs["league_pk"])
        return (
            Matchday.objects.filter(league=league)
            .prefetch_related(
                "fixtures__match__home_team",
                "fixtures__match__away_team",
                "fixtures__match__events__player",
                "fixtures__match__events__assist_player",
                "fixtures__match__events__team",
            )
            .order_by("-date", "-id")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MatchdayCreateSerializer
        return MatchdaySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["league"] = get_object_or_404(League, pk=self.kwargs["league_pk"])
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        matchday = serializer.save()
        output = MatchdaySerializer(matchday, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)
