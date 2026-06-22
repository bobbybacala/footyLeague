from django.urls import path

from apps.leagues.views import ConcludeLeagueView, LeagueDetailView, LeagueListCreateView
from apps.players.views import LeaguePlayerListView

urlpatterns = [
    path("", LeagueListCreateView.as_view(), name="league-list-create"),
    path("<int:pk>/conclude/", ConcludeLeagueView.as_view(), name="league-conclude"),
    path("<int:pk>/", LeagueDetailView.as_view(), name="league-detail"),
    path(
        "<int:league_pk>/players/",
        LeaguePlayerListView.as_view(),
        name="league-players",
    ),
]
