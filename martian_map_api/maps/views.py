from django.http import HttpRequest, HttpResponse, JsonResponse
from django.templatetags.static import static

from maps.services import services
from martian_map import settings


def PNGmap(request: HttpRequest):
    img = static('map.png')
    imgUrl = request.build_absolute_uri(img)
    return HttpResponse(imgUrl)

def shortestPath(request: HttpRequest):
    fromPixelX = request.GET.get('fromX')
    fromPixelY = request.GET.get('fromY')
    toPixelX = request.GET.get('toX')
    toPixelY = request.GET.get('toY')
    tifMp = 'MOLA_128ppd_topo.tif'
    tifTH = 'TES_Thermal_Inertia_numeric.tif'
    allPath = services.getLeastCostRoute(150,957,130,374,tifMp,tifTH)
    return JsonResponse(allPath,safe=False)