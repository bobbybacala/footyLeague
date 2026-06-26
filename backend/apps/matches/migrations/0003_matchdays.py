import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leagues", "0003_set_active_leagues"),
        ("matches", "0002_match_jersey_colors"),
    ]

    operations = [
        migrations.CreateModel(
            name="Matchday",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("date", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "league",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="matchdays",
                        to="leagues.league",
                    ),
                ),
            ],
            options={
                "ordering": ["-date", "-id"],
            },
        ),
        migrations.CreateModel(
            name="MatchdayFixture",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "match",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="matchday_fixture",
                        to="matches.match",
                    ),
                ),
                (
                    "matchday",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="fixtures",
                        to="matches.matchday",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
    ]
