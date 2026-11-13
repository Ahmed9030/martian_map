from django.http import HttpRequest, JsonResponse
from django.templatetags.static import static

from maps.services import services
from maps.models import Map, Vehicle


def getMap(request: HttpRequest):
    mapId = request.GET.get('map')
    map = Map.objects.prefetch_related('maps').get(id=mapId)
    img = static(map.PNGname)
    imgUrl = request.build_absolute_uri(img)
    tifMp = map.Elename
    coordinates = services.getImageBounds(tifMp)
    return JsonResponse({'title': map.title,
                         'url' : imgUrl,
                         'coordinates' : coordinates,
                         'destination' : list(map.maps.values())},safe=False)

def Path(request: HttpRequest):
    mapId = request.GET.get('map')
    map = Map.objects.get(id=mapId)
    mode = request.GET.get('mode')
    coordinates = {
        "startX" : request.GET.get('startX'),
        "startY" : request.GET.get('startY'),
        "endX" : request.GET.get('endX'),
        "endY" : request.GET.get('endY')
    }

    tifFiles = {
       'elevation' : map.Elename,
       'thermalDay' : map.Thermname,
       'thermalNight' : map.ThermNightname,
       'fe' : map.Fename,
       'si' : map.Siname,
       'wind' : map.Windname,
       'H2O' : map.H2Oname,
    }
    safelimites = {
        'maxTherm' : request.GET.get('maxTherm'),
        'minTherm' : request.GET.get('minTherm'),
        'maxSlope' : request.GET.get('maxSlope'),
        'maxWind' : request.GET.get('maxWind'),
        'speed' : request.GET.get('speed'),
        'step': request.GET.get('step'),
        'mode' : mode
    }

    resource_weights = None
    if mode == 'science':
        def parse_float(val, default_val):
            try:
                return float(val) if val is not None else default_val
            except (ValueError, TypeError):
                return default_val

        h2o = parse_float(request.GET.get('h2o'), 0.8)
        fe = parse_float(request.GET.get('fe'), 0.6)
        si = parse_float(request.GET.get('si'), 0.6)

        resource_weights = {
            'h2o': h2o,
            'fe': fe,
            'si': si
        }

    try:
        allPath = services.getLeastCostRoute(
            coordinates, 
            tifFiles, 
            safelimites, 
            resource_weights
        )
    except ValueError as err:
        return JsonResponse({"error": str(err)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": f"Path calculation failed: {str(exc)}"}, status=500)
    
    return JsonResponse(allPath,safe=False)

def vehicles(request: HttpRequest):
    vehiclesInfo = list(Vehicle.objects.all().values())
    return JsonResponse(vehiclesInfo,safe=False)

def custom_404(request, exception=None):
    return JsonResponse({
        "error": "Not Found",
        "message": "The requested resource/endpoint was not found."
    }, status=404)