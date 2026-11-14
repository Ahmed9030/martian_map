import logging
import uuid
from urllib.parse import urlencode

from django.http import HttpRequest, JsonResponse
from django.templatetags.static import static
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect, get_object_or_404

from maps.services import services
from maps.models import Flight, Map, Profile, Vehicle

logger = logging.getLogger(__name__)

MAX_PROFILE_NAME_LENGTH = 255
# `maxRad` is a legacy, non-null column that is not used anywhere in routing.
# Flights store this sentinel so the column stays populated without implying a
# radiation limit.
MAX_RAD_SENTINEL = 9999.0


def _parse_profile_token(raw_token):
    """Return a validated profile token string, or None when invalid/missing."""
    if not raw_token:
        return None
    try:
        return str(uuid.UUID(str(raw_token)))
    except (ValueError, AttributeError, TypeError):
        return None


def _flight_to_dict(flight: Flight) -> dict:
    return {
        'id': flight.id,
        'map_id': flight.map_id,
        'map_title': flight.map.title if flight.map else None,
        'x_start_coord': flight.x_start_coord,
        'y_start_coord': flight.y_start_coord,
        'x_end_coord': flight.x_end_coord,
        'y_end_coord': flight.y_end_coord,
        'maxSpeed': flight.maxSpeed,
        'maxRad': flight.maxRad,
        'maxEle': flight.maxEle,
        'maxTherm': flight.maxTherm,
        'maxWind': flight.maxWind,
        'minTherm': flight.minTherm,
        'mode': flight.mode,
        'created_at': flight.created_at.isoformat() if flight.created_at else None,
        'estimated_time': flight.estimated_time,
        'distance_km': flight.distance_km,
    }


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
    astro = _parse_profile_token(request.GET.get('token'))
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

    # Record the visit for a known profile. `record=0` skips logging (used when
    # the profile page replays an existing visit).
    should_record = request.GET.get('record', '1') != '0'
    if should_record and astro:
        profile = Profile.objects.filter(token=astro).first()
        if profile is not None:
            try:
                Flight.objects.create(
                    x_start_coord=float(coordinates['startX']),
                    y_start_coord=float(coordinates['startY']),
                    x_end_coord=float(coordinates['endX']),
                    y_end_coord=float(coordinates['endY']),
                    maxTherm=float(safelimites['maxTherm']),
                    minTherm=float(safelimites['minTherm']),
                    maxEle=float(safelimites['maxSlope']),
                    maxRad=MAX_RAD_SENTINEL,
                    maxWind=float(safelimites['maxWind']),
                    maxSpeed=float(safelimites['speed'] or 0.0),
                    mode=mode,
                    astronaut=profile,
                    map=map,
                    estimated_time=allPath['estimated_time_hours'],
                    distance_km=allPath['route_length_km'],
                )
            except (TypeError, ValueError) as exc:
                # A failed log must never hide a valid route from the client.
                logger.warning("Could not record flight for profile %s: %s", astro, exc)

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

    name = str(name).strip()
    if len(name) > MAX_PROFILE_NAME_LENGTH:
        return JsonResponse(
            {"error": f"Name must be at most {MAX_PROFILE_NAME_LENGTH} characters."},
            status=400,
            safe=False,
        )

    astru = Profile.objects.create(name=name)
    return JsonResponse({"token": str(astru.token), "name": astru.name}, status=201, safe=False)

def flights(request: HttpRequest):
    token = _parse_profile_token(request.GET.get('token'))
    if token is None:
        return JsonResponse({"error": "A valid profile token is required."}, status=400)

    flightsLog = (
        Flight.objects.filter(astronaut_id=token)
        .select_related('map')
        .order_by('-created_at')
    )
    return JsonResponse(
        {"flights": [_flight_to_dict(flight) for flight in flightsLog]},
        safe=False,
    )

def reVisit(request: HttpRequest):
    try:
        flight_id = int(request.GET.get('id'))
    except (TypeError, ValueError):
        return JsonResponse({"error": "A numeric flight id is required."}, status=400)

    flight = get_object_or_404(Flight, id=flight_id)
    payload = _flight_to_dict(flight)

    wants_json = (
        request.GET.get('format') == 'json'
        or 'application/json' in request.headers.get('Accept', '')
    )
    if wants_json:
        return JsonResponse(payload)

    query = {
        'startX': flight.x_start_coord,
        'startY': flight.y_start_coord,
        'endX': flight.x_end_coord,
        'endY': flight.y_end_coord,
        'maxSlope': flight.maxEle,
        'minTherm': flight.minTherm,
        'maxTherm': flight.maxTherm,
        'maxWind': flight.maxWind,
        'speed': flight.maxSpeed,
    }
    if flight.mode:
        query['mode'] = flight.mode
    if flight.map_id is not None:
        query['map'] = flight.map_id
    return redirect(f"/path/?{urlencode(query)}")

def custom_404(request, exception=None):
    return JsonResponse({
        "error": "Not Found",
        "message": "The requested resource/endpoint was not found."
    }, status=404)
