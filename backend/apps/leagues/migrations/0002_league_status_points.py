from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("leagues", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="league",
            name="status",
            field=models.CharField(
                choices=[
                    ("DRAFT", "Draft"),
                    ("ACTIVE", "Active"),
                    ("COMPLETED", "Completed"),
                ],
                default="DRAFT",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="league",
            name="points_win",
            field=models.PositiveSmallIntegerField(default=3),
        ),
        migrations.AddField(
            model_name="league",
            name="points_draw",
            field=models.PositiveSmallIntegerField(default=1),
        ),
    ]
