from django.shortcuts import get_object_or_404
from rest_framework import generics

from apps.common.enums import LeagueStatus
from apps.leagues.models import League
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


class PlayerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlayerSerializer
    queryset = Player.objects.select_related("team")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = self.get_object().team
        return context

    def perform_destroy(self, instance):
        from apps.matches.models import MatchEvent
        from rest_framework.exceptions import ValidationError

        if instance.team.league.status != LeagueStatus.DRAFT:
            if MatchEvent.objects.filter(player=instance).exists():
                raise ValidationError(
                    "Cannot delete a player with match history. Mark them as inactive instead."
                )
        instance.delete()


class LeaguePlayerListView(generics.ListAPIView):
    serializer_class = PlayerSerializer

    def get_queryset(self):
        league = get_object_or_404(League, pk=self.kwargs["league_pk"])
        return Player.objects.filter(team__league=league).select_related("team")
