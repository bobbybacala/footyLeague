from django.db import models

from apps.common.enums import MatchEventType, MatchStatus
from apps.leagues.models import League
from apps.players.models import Player
from apps.teams.models import Team


class Match(models.Model):
    league = models.ForeignKey(
        League, on_delete=models.CASCADE, related_name="matches"
    )
    home_team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="home_matches"
    )
    away_team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="away_matches"
    )
    home_score = models.PositiveIntegerField(default=0)
    away_score = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=MatchStatus.choices,
        default=MatchStatus.PENDING,
    )
    scheduled_date = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    home_jersey_color = models.CharField(max_length=7, blank=True, default="")
    away_jersey_color = models.CharField(max_length=7, blank=True, default="")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"


class MatchEvent(models.Model):
    match = models.ForeignKey(
        Match, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=20, choices=MatchEventType.choices)
    player = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="match_events"
    )
    assist_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assisted_events",
    )
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="match_events"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.event_type} - {self.player}"


class Matchday(models.Model):
    league = models.ForeignKey(
        League, on_delete=models.CASCADE, related_name="matchdays"
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return self.title


class MatchdayFixture(models.Model):
    matchday = models.ForeignKey(
        Matchday, on_delete=models.CASCADE, related_name="fixtures"
    )
    match = models.OneToOneField(
        Match, on_delete=models.CASCADE, related_name="matchday_fixture"
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.matchday.title}: {self.match}"
