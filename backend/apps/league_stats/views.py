from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.league_stats.awards import compute_awards
from apps.league_stats.standings import compute_standings
from apps.leagues.models import League


class StandingsView(APIView):
    def get(self, request, league_pk):
        league = get_object_or_404(League, pk=league_pk)
        return Response(compute_standings(league))


class AwardsView(APIView):
    def get(self, request, league_pk):
        league = get_object_or_404(League, pk=league_pk)
        return Response(compute_awards(league))
