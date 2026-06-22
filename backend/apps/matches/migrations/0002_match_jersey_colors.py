from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("matches", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="match",
            name="home_jersey_color",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
        migrations.AddField(
            model_name="match",
            name="away_jersey_color",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
    ]
