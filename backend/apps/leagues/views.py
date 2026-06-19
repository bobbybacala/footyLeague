from rest_framework import generics

from apps.leagues.models import League
from apps.leagues.serializers import LeagueSerializer


class LeagueListCreateView(generics.ListCreateAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer


class LeagueDetailView(generics.RetrieveUpdateAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer
