from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.common.auth import issue_role_token, VIEWER, EDITOR
from apps.leagues.models import League


@override_settings(EDITOR_SECRET="test-secret")
class AppRolePermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.league = League.objects.create(name="Test", venue="Ground")

    def test_viewer_can_read_leagues(self):
        token = issue_role_token(VIEWER)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/leagues/")
        self.assertEqual(response.status_code, 200)

    def test_viewer_cannot_create_league(self):
        token = issue_role_token(VIEWER)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.post(
            "/api/leagues/",
            {"name": "New", "venue": "Venue"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_editor_can_create_league(self):
        token = issue_role_token(EDITOR)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.post(
            "/api/leagues/",
            {"name": "New", "venue": "Venue"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_editor_login_with_wrong_secret(self):
        response = self.client.post(
            "/api/auth/editor/",
            {"secret_key": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_editor_login_with_correct_secret(self):
        response = self.client.post(
            "/api/auth/editor/",
            {"secret_key": "test-secret"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], EDITOR)
        self.assertIn("token", response.data)
