from django.urls import path

from apps.fixtures.views import FixturePreviewView, GenerateFixturesView

urlpatterns = [
    path(
        "<int:league_pk>/generate-fixtures/",
        GenerateFixturesView.as_view(),
        name="generate-fixtures",
    ),
    path(
        "<int:league_pk>/fixture-preview/",
        FixturePreviewView.as_view(),
        name="fixture-preview",
    ),
]
