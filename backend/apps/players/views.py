from django.shortcuts import get_object_or_404
from rest_framework import generics

from apps.players.models import Player
from apps.players.serializers import PlayerSerializer
from apps.teams.models import Team


class TeamPlayerListCreateView(generics.ListCreateAPIView):
    serializer_class = PlayerSerializer

    def get_queryset(self):
        team = get_object_or_404(Team, pk=self.kwargs["team_pk"])
        return Player.objects.filter(team=team)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = get_object_or_404(Team, pk=self.kwargs["team_pk"])
        return context

    def perform_create(self, serializer):
        team = get_object_or_404(Team, pk=self.kwargs["team_pk"])
        serializer.save(team=team)
