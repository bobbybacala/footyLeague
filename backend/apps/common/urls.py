from django.urls import path

from apps.common.auth_views import EditorLoginView, SessionView, ViewerLoginView

urlpatterns = [
    path("session/", SessionView.as_view(), name="auth-session"),
    path("viewer/", ViewerLoginView.as_view(), name="auth-viewer"),
    path("editor/", EditorLoginView.as_view(), name="auth-editor"),
]
