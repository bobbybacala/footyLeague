from django.urls import path

from apps.teams.views import LeagueTeamListCreateView

urlpatterns = [
    path(
        "<int:league_pk>/teams/",
        LeagueTeamListCreateView.as_view(),
        name="league-teams",
    ),
]
