from django.db import models

from apps.common.enums import LeagueFormat


class League(models.Model):
    name = models.CharField(max_length=200)
    venue = models.CharField(max_length=200)
    format = models.CharField(
        max_length=30,
        choices=LeagueFormat.choices,
        default=LeagueFormat.SINGLE_ROUND_ROBIN,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
