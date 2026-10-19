from django.http import HttpRequest, JsonResponse
from django.templatetags.static import static

from maps.services import services


def PNGmap(request: HttpRequest):
    img = static('map.png')
    imgUrl = request.build_absolute_uri(img)
    tifMp = 'MOLA_128ppd_topo.tif'
    coordinates = services.get_image_bounds(tifMp)
    return JsonResponse({'url':imgUrl,'coordinates':coordinates},safe=False)

def shortestPath(request: HttpRequest):
    coordinates = {
        "startX" : request.GET.get('startX'),
        "startY" : request.GET.get('startY'),
        "endX" : request.GET.get('endX'),
        "endY" : request.GET.get('endY')
    }
    #128 zoom tif files
    tifFiles = {
       'elevation' : 'MOLA_128ppd_topo.tif',
       'thermal' : 'TES_Thermal_Inertia_numeric.tif',
       'H2O' : 'GRS_H2O_conc_numeric.tif'
    }
    safelimites={
        'maxTherm' : request.GET.get('maxTherm'),
        'minTherm' : request.GET.get('minTherm'),
        'maxSlope' : request.GET.get('maxSlope'),
        'maxRadiation' : request.GET.get('maxRadiation'),
    }

    allPath = services.getLeastCostRoute(coordinates, tifFiles, safelimites)
    return JsonResponse(allPath,safe=False)