from django.db import migrations


def set_active_for_existing(apps, schema_editor):
    League = apps.get_model("leagues", "League")
    Match = apps.get_model("matches", "Match")
    for league in League.objects.all():
        if Match.objects.filter(league=league).exists():
            league.status = "ACTIVE"
            league.save(update_fields=["status"])


class Migration(migrations.Migration):
    dependencies = [
        ("leagues", "0002_league_status_points"),
        ("matches", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(set_active_for_existing, migrations.RunPython.noop),
    ]
