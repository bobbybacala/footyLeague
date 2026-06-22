from django.db import models

from apps.common.enums import LeagueFormat, LeagueStatus


class League(models.Model):
    name = models.CharField(max_length=200)
    venue = models.CharField(max_length=200)
    format = models.CharField(
        max_length=30,
        choices=LeagueFormat.choices,
        default=LeagueFormat.SINGLE_ROUND_ROBIN,
    )
    status = models.CharField(
        max_length=20,
        choices=LeagueStatus.choices,
        default=LeagueStatus.DRAFT,
    )
    points_win = models.PositiveSmallIntegerField(default=3)
    points_draw = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
