from django.urls import path

from apps.players.views import TeamPlayerListCreateView

urlpatterns = [
    path(
        "<int:team_pk>/players/",
        TeamPlayerListCreateView.as_view(),
        name="team-players",
    ),
]
