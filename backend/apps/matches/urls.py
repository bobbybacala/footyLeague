from django.urls import path

from apps.matches.views import (
    EndMatchView,
    GoalView,
    LeagueMatchListView,
    MatchDetailView,
    RedCardView,
    StartMatchView,
    YellowCardView,
)

urlpatterns = [
    path("<int:pk>/", MatchDetailView.as_view(), name="match-detail"),
    path("<int:pk>/start/", StartMatchView.as_view(), name="match-start"),
    path("<int:pk>/goal/", GoalView.as_view(), name="match-goal"),
    path("<int:pk>/yellow-card/", YellowCardView.as_view(), name="match-yellow-card"),
    path("<int:pk>/red-card/", RedCardView.as_view(), name="match-red-card"),
    path("<int:pk>/end/", EndMatchView.as_view(), name="match-end"),
    path(
        "leagues/<int:league_pk>/matches/",
        LeagueMatchListView.as_view(),
        name="league-matches",
    ),
]
