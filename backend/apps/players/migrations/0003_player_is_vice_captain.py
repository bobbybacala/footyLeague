from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("players", "0002_player_is_inactive"),
    ]

    operations = [
        migrations.AddField(
            model_name="player",
            name="is_vice_captain",
            field=models.BooleanField(default=False),
        ),
    ]
