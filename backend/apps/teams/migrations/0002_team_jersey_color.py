from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="jersey_color",
            field=models.CharField(default="#22c55e", max_length=7),
        ),
    ]
