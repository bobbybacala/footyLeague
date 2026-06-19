from django.db import models

from apps.leagues.models import League


class Team(models.Model):
    league = models.ForeignKey(
        League, on_delete=models.CASCADE, related_name="teams"
    )
    name = models.CharField(max_length=200)
    logo = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["league", "name"], name="unique_team_name_per_league"
            )
        ]

    def __str__(self):
        return self.name
