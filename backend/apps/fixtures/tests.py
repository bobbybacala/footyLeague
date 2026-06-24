from django.test import TestCase

from apps.common.enums import LeagueFormat, LeagueStatus
from apps.fixtures.services import count_fixtures, generate_fixtures, generate_pairings
from apps.leagues.models import League
from apps.teams.models import Team


class FixtureCountTests(TestCase):
    def setUp(self):
        self.league = League.objects.create(
            name="Test League",
            venue="Test Ground",
            format=LeagueFormat.DOUBLE_ROUND_ROBIN,
            status=LeagueStatus.DRAFT,
        )
        self.teams = [
            Team.objects.create(league=self.league, name=f"Team {i}")
            for i in range(1, 4)
        ]

    def test_three_team_double_round_robin_generates_six_fixtures(self):
        self.assertEqual(len(generate_pairings([t.id for t in self.teams])), 3)
        self.assertEqual(count_fixtures(self.league), 6)

        matches = generate_fixtures(self.league)
        self.assertEqual(len(matches), 6)

    def test_four_team_double_round_robin_generates_twelve_fixtures(self):
        league = League.objects.create(
            name="Four Team League",
            venue="Test Ground",
            format=LeagueFormat.DOUBLE_ROUND_ROBIN,
            status=LeagueStatus.DRAFT,
        )
        for i in range(1, 5):
            Team.objects.create(league=league, name=f"Team {i}")

        self.assertEqual(count_fixtures(league), 12)
        matches = generate_fixtures(league)
        self.assertEqual(len(matches), 12)
