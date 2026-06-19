from django.db import models

from apps.common.enums import PlayerPosition
from apps.teams.models import Team


class Player(models.Model):
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="players"
    )
    name = models.CharField(max_length=200)
    position = models.CharField(max_length=20, choices=PlayerPosition.choices)
    is_captain = models.BooleanField(default=False)
    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)
    yellow_cards = models.PositiveIntegerField(default=0)
    red_cards = models.PositiveIntegerField(default=0)
    clean_sheets = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
