import uuid
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
    ThermNightname = models.CharField(max_length=255)
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
class Profile(models.Model):
    name = models.CharField(max_length=255)
    token = models.UUIDField(unique=True,primary_key=True,default=uuid.uuid4)
class Flight(models.Model):
    x_start_coord = models.FloatField()
    y_start_coord = models.FloatField()
    x_end_coord = models.FloatField()
    y_end_coord = models.FloatField()
    maxSpeed = models.FloatField()
    maxRad = models.FloatField()
    maxEle = models.FloatField()
    maxTherm = models.FloatField()
    maxWind = models.FloatField()
    minTherm = models.FloatField()
    mode = models.CharField(max_length=255,null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    estimated_time = models.FloatField()
    distance_km = models.FloatField()
    astronaut = models.ForeignKey(Profile,
                                  on_delete=models.CASCADE,
                                  related_name="flights",
                                  null=True,
                                  blank=True)
    map = models.ForeignKey(Map,
                                  on_delete=models.CASCADE,
                                  related_name="flights",
                                  null=True,
                                  blank=True)