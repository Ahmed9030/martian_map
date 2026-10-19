from django.urls import path

from . import views


urlpatterns = [
    path('maps/',views.PNGmap,name='maps'),
    path('shortpath/',views.shortestPath,name='shortpath'),
]
