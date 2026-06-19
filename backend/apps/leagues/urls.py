from django.urls import path

from apps.leagues.views import LeagueDetailView, LeagueListCreateView

urlpatterns = [
    path("", LeagueListCreateView.as_view(), name="league-list-create"),
    path("<int:pk>/", LeagueDetailView.as_view(), name="league-detail"),
]
