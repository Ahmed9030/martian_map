from django.urls import path

from . import views


urlpatterns = [
    path('map/',views.getMap,name='map'),
    path('path/',views.Path,name='path'),
    path('vehicles/',views.vehicles,name='vehicles'),
    path('createastro/',views.createAstro,name='createastro'),
    path('flights/',views.flights,name='flights'),
    path('revisit/',views.reVisit,name='reVisit'),
]
