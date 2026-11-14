# Generated to merge the two migration branches:
#   0004_map_thermnightname (Map.ThermNightname)
#   0008_flight_map        (Profile / Flight chain)
# Without this merge Django reports multiple leaf nodes and refuses to migrate.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('maps', '0004_map_thermnightname'),
        ('maps', '0008_flight_map'),
    ]

    operations = []
