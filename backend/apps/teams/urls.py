from django.urls import path

from apps.teams.views import LeagueTeamListCreateView, TeamDetailView

urlpatterns = [
    path(
        "<int:league_pk>/teams/",
        LeagueTeamListCreateView.as_view(),
        name="league-teams",
    ),
    path(
        "teams/<int:pk>/",
        TeamDetailView.as_view(),
        name="team-detail",
    ),
]
