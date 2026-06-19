from django.urls import path

from apps.league_stats.views import AwardsView, StandingsView

urlpatterns = [
    path("<int:league_pk>/standings/", StandingsView.as_view(), name="league-standings"),
    path("<int:league_pk>/awards/", AwardsView.as_view(), name="league-awards"),
]
