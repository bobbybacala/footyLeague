from django.urls import path

from apps.matches.matchday_views import LeagueMatchdayListCreateView
from apps.matches.views import (
    EndMatchView,
    GoalView,
    LeagueMatchListView,
    MatchDetailView,
    RedCardView,
    RemoveEventView,
    StartMatchView,
    UndoLastEventView,
    YellowCardView,
)

urlpatterns = [
    path("<int:pk>/", MatchDetailView.as_view(), name="match-detail"),
    path("<int:pk>/start/", StartMatchView.as_view(), name="match-start"),
    path("<int:pk>/goal/", GoalView.as_view(), name="match-goal"),
    path("<int:pk>/yellow-card/", YellowCardView.as_view(), name="match-yellow-card"),
    path("<int:pk>/red-card/", RedCardView.as_view(), name="match-red-card"),
    path("<int:pk>/end/", EndMatchView.as_view(), name="match-end"),
    path("<int:pk>/undo/", UndoLastEventView.as_view(), name="match-undo"),
    path(
        "<int:pk>/events/<int:event_pk>/remove/",
        RemoveEventView.as_view(),
        name="match-remove-event",
    ),
    path(
        "leagues/<int:league_pk>/matchdays/",
        LeagueMatchdayListCreateView.as_view(),
        name="league-matchdays",
    ),
    path(
        "leagues/<int:league_pk>/matches/",
        LeagueMatchListView.as_view(),
        name="league-matches",
    ),
]
