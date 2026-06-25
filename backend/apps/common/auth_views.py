import os

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.auth import (
    EDITOR,
    VIEWER,
    get_editor_secret,
    get_request_role,
    issue_role_token,
)


class SessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        role = get_request_role(request)
        return Response({"role": role})


class ViewerLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = issue_role_token(VIEWER)
        return Response({"role": VIEWER, "token": token})


class EditorLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        secret = request.data.get("secret_key", "")
        expected = get_editor_secret()

        if not expected:
            return Response(
                {
                    "detail": "Editor access is not configured on the server "
                    "(EDITOR_SECRET is missing)."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if secret != expected:
            return Response(
                {"detail": "Invalid editor secret key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = issue_role_token(EDITOR)
        return Response({"role": EDITOR, "token": token})
