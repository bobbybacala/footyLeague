from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fixtures.services import generate_fixtures
from apps.leagues.models import League
from apps.matches.serializers import MatchSerializer


class GenerateFixturesView(APIView):
    def post(self, request, league_pk):
        league = get_object_or_404(League, pk=league_pk)
        try:
            matches = generate_fixtures(league)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
