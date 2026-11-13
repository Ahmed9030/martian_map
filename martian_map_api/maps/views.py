from django.http import HttpRequest, JsonResponse
from django.templatetags.static import static
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect,get_object_or_404

from maps.services import services
from maps.models import Flight, Map, Profile, Vehicle


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
    astro = request.GET.get('token')
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
    if astro and (Profile.objects.filter(token=astro).exists()):
        Flight.objects.create(x_start_coord=request.GET.get('startX'),
                                       y_start_coord=request.GET.get('startY'),
                                       x_end_coord=request.GET.get('endX'),
                                       y_end_coord=request.GET.get('endY'),
                                       maxTherm=request.GET.get('maxTherm'),
                                       minTherm=request.GET.get('minTherm'),
                                       maxEle=request.GET.get('maxSlope'),
                                       maxRad=request.GET.get('maxRadiation'),
                                       maxWind=request.GET.get('maxWind'),
                                       maxSpeed=request.GET.get('speed'),
                                       mode=request.GET.get('mode'),
                                       astronaut_id=astro,
                                       estimated_time=allPath['estimated_time_hours'],
                                       distance_km=allPath['route_length_km'])
    return JsonResponse(allPath,safe=False)

def vehicles(request: HttpRequest):
    vehiclesInfo = list(Vehicle.objects.all().values())
    return JsonResponse(vehiclesInfo,safe=False)

@csrf_exempt
@require_POST
def createAstro(request: HttpRequest):
    name = request.POST.get('name')

    if not name or not str(name).strip():
        return JsonResponse({"error": "Name field is required."}, status=400, safe=False)

    astru = Profile.objects.create(name=name.strip())
    return JsonResponse({"token": str(astru.token)}, status=201, safe=False)
def flights(request: HttpRequest):
    flightsLog = list(Flight.objects.filter(astronaut_id=request.GET.get('token')).values())
    return JsonResponse({"flights":flightsLog}, safe=False)
def reVisit(request: HttpRequest):
    flight_id = request.GET.get('id')

    flight = get_object_or_404(Flight, id=flight_id)
    return redirect(f"/path/?startX={flight.x_start_coord}&startY={flight.y_start_coord}&endX={flight.x_end_coord}&endY={flight.y_end_coord}&maxSlope={flight.maxEle}&minTherm={flight.minTherm}&maxTherm={flight.maxTherm}&map={flight.map_id}&maxRadiation={flight.maxRad}&maxWind={flight.maxWind}&speed={flight.maxSpeed}")

def custom_404(request, exception=None):
    return JsonResponse({
        "error": "Not Found",
        "message": "The requested resource/endpoint was not found."
    }, status=404)