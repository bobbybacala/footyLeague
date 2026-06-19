from django.urls import path

from apps.fixtures.views import GenerateFixturesView

urlpatterns = [
    path(
        "<int:league_pk>/generate-fixtures/",
        GenerateFixturesView.as_view(),
        name="generate-fixtures",
    ),
]
