from django.db import models

class Map(models.Model):
    title = models.CharField(max_length=255)
    PNGname = models.CharField(max_length=255)
    Elename = models.CharField(max_length=255)
    Radname = models.CharField(max_length=255)
    Fename = models.CharField(max_length=255)
    H2Oname = models.CharField(max_length=255)
    Siname = models.CharField(max_length=255)
    Thermname = models.CharField(max_length=255)
    Windname = models.CharField(max_length=255)

class Vehicle(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True, default=None)
    photo = models.URLField(null=True, blank=True, default=None)
    maxSpead = models.FloatField()
    maxRad = models.FloatField()
    maxEle = models.FloatField()
    maxTherm = models.FloatField()
    maxWind = models.FloatField()
    minTherm = models.FloatField()

class Destinations(models.Model):
    title = models.CharField(max_length=255)
    map_id = models.ForeignKey(
        Map,
        on_delete=models.CASCADE,
        related_name='maps',
        null=True,
        blank=True)
    description = models.TextField(null=True, blank=True, default=None)
    photo = models.URLField(null=True, blank=True, default=None)
    x_coord = models.FloatField()
    y_coord = models.FloatField()
