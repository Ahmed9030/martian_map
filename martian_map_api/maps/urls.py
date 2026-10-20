from django.urls import path

from . import views


urlpatterns = [
    path('map/',views.getMap,name='map'),
    path('path/',views.Path,name='path'),
    path('vehicles/',views.vehicles,name='vehicles'),
]
