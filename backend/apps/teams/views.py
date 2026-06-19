from django.shortcuts import get_object_or_404
from rest_framework import generics

from apps.leagues.models import League
from apps.teams.models import Team
from apps.teams.serializers import TeamSerializer


class LeagueTeamListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer

    def get_queryset(self):
        league = get_object_or_404(League, pk=self.kwargs["league_pk"])
        return Team.objects.filter(league=league)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["league"] = get_object_or_404(League, pk=self.kwargs["league_pk"])
        return context

    def perform_create(self, serializer):
        league = get_object_or_404(League, pk=self.kwargs["league_pk"])
        serializer.save(league=league)
