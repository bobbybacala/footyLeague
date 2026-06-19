from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/leagues/", include("apps.leagues.urls")),
    path("api/leagues/", include("apps.teams.urls")),
    path("api/leagues/", include("apps.fixtures.urls")),
    path("api/leagues/", include("apps.league_stats.urls")),
    path("api/teams/", include("apps.players.urls")),
    path("api/matches/", include("apps.matches.urls")),
]
