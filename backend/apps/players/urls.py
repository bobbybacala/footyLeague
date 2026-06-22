from django.urls import path

from apps.players.views import PlayerDetailView, TeamPlayerListCreateView

urlpatterns = [
    path(
        "<int:team_pk>/players/",
        TeamPlayerListCreateView.as_view(),
        name="team-players",
    ),
    path(
        "players/<int:pk>/",
        PlayerDetailView.as_view(),
        name="player-detail",
    ),
]
