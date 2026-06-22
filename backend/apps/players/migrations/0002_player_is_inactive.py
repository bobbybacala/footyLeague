from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("players", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="player",
            name="is_inactive",
            field=models.BooleanField(default=False),
        ),
    ]
