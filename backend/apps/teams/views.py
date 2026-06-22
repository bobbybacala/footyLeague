from django.shortcuts import get_object_or_404
from rest_framework import generics

from apps.leagues.models import League
from apps.teams.models import Team
from apps.teams.serializers import TeamSerializer
from apps.teams.services import create_team_with_fixtures, delete_team


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
        team = serializer.save(league=league)
        create_team_with_fixtures(league, team)


class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    queryset = Team.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["league"] = self.get_object().league
        return context

    def perform_destroy(self, instance):
        delete_team(instance)
