from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.enums import LeagueStatus
from apps.leagues.models import League
from apps.leagues.serializers import LeagueSerializer


class LeagueListCreateView(generics.ListCreateAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer


class LeagueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer


class ConcludeLeagueView(APIView):
    def post(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        if league.status == LeagueStatus.COMPLETED:
            return Response(
                {"detail": "League is already concluded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if league.status == LeagueStatus.DRAFT:
            return Response(
                {"detail": "Cannot conclude a league that has not started."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        league.status = LeagueStatus.COMPLETED
        league.save(update_fields=["status"])
        return Response(LeagueSerializer(league).data)
