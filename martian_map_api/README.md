# Martian Map API

Django-based HTTP API that serves Martian map imagery, destination points, rover
data, and computes safe route plans over Martian terrain rasters.

- Framework: **Django 6** (plain Django views returning `JsonResponse`)
- Entry point: `manage.py` (dev: `python manage.py runserver`)
- URL config: `martian_map/urls.py` (mounts `maps.urls` at the site root)
- Views: `maps/views.py`
- Route engine / helpers: `maps/services/services.py`

All routes are **GET-only** and return `application/json`. There is no
authentication. Query parameters are passed as strings and cast inside the
services layer.

---

## Units of measure

The entire API uses the following fixed units.

| Quantity | Unit | Symbol |
| --- | --- | --- |
| Temperature (thermal raster, `therm`, `minTherm`, `maxTherm`) | **Kelvin** | K |
| Wind speed (`maxWind`, `maximum_wind_speed`) | **metres per second** | m/s |
| Route length (`route_length`) | **kilometres** | km |
| Estimated time (`estimated_time`) | **hours** | h |
| Silicon abundance (`Si`) | **percent** | % |
| Water abundance (`H2O`) | **percent** | % |
| Iron abundance (`Fe`) | **percent** | % |
| Radiation (`radiation`, `maxRadiation`) | **counts per second** | cps |

Notes:
- Coordinates (`X_coordinate`, `Y_coordinate`, `x_coord`, `y_coord`, and the
  bound polygon) are expressed in the map's raster CRS units (the map GeoTIFF's
  native coordinate system).
- `Slope_Degrees` / `maximum_slope` / `minimum_slope` are in **degrees**.
- `speed` is provided in **km/h** so that `estimated_time = route_length (km) / speed (km/h)` is in **hours**.
- `maxEle` is a vehicle field; its unit follows the elevation raster (metres of
  relief relative to the map datum).

---

## GET `/map/`

Returns the basemap image, its bounding coordinates, and the destinations that
belong to a map.

### Request (query string)

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `map` | integer | yes | id of the `Map` row to load |

Example:

```
GET /map/?map=1
```

### Response `200`

```json
{
  "title": "Jezero Crater",
  "url": "http://host/static/jezeroMap.png",
  "coordinates": [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom]
  ],
  "destination": [
    {
      "id": 1,
      "title": "Landing Site",
      "description": "Primary touchdown point",
      "photo": "http://host/static/landing.png",
      "x_coord": 45123.0,
      "y_coord": 88210.5,
      "map_id": 1
    }
  ]
}
```

| Field | Type | Unit | Description |
| --- | --- | --- | --- |
| `title` | string | – | Map display name |
| `url` | string | – | Absolute URL of the basemap PNG |
| `coordinates` | number[4][2] | CRS units | Bounding polygon of the elevation GeoTIFF (4 corners) |
| `destination` | object[] | – | All destinations on this map |
| `destination[].id` | integer | – | Destination id |
| `destination[].title` | string | – | Destination name |
| `destination[].description` | string \| null | – | Free text description |
| `destination[].photo` | string \| null | – | Absolute photo URL |
| `destination[].x_coord` | number | CRS units | Destination X |
| `destination[].y_coord` | number | CRS units | Destination Y |
| `destination[].map_id` | integer \| null | – | Owning map id |

---

## GET `/path/`

Computes a route between two points across the map rasters and returns the path
waypoints plus aggregate statistics.

Two modes:

- **least-cost** (default): minimises terrain cost (slope, temperature,
  radiation, wind).
- **science** (`mode=science`): also maximises resource richness (H2O, Fe, Si)
  along the path.

### Request (query string)

Common parameters:

| Param | Type | Unit | Required | Description |
| --- | --- | --- | --- | --- |
| `map` | integer | – | yes | id of the `Map` row (selects the 7 rasters) |
| `mode` | string | – | no | `science` selects resource-rich routing; anything else = least-cost |
| `startX` | number | CRS units | yes | Start X coordinate |
| `startY` | number | CRS units | yes | Start Y coordinate |
| `endX` | number | CRS units | yes | End X coordinate |
| `endY` | number | CRS units | yes | End Y coordinate |
| `maxSlope` | number | degrees | yes | Maximum traversable slope |
| `maxTherm` | number | K | yes | Maximum safe temperature |
| `minTherm` | number | K | yes | Minimum safe temperature |
| `maxRadiation` | number | cps | yes | Maximum safe radiation |
| `maxWind` | number | m/s | yes | Maximum safe wind speed |
| `speed` | number | km/h | yes | Rover speed, used for `estimated_time` |

Science-mode-only parameters:

| Param | Type | Unit | Required | Description |
| --- | --- | --- | --- | --- |
| `h2o` | number | – | no | Weight of water abundance in the resource score (default `0.8`) |
| `fe` | number | – | no | Weight of iron abundance (default `0.6`) |
| `si` | number | – | no | Weight of silicon abundance (default `0.6`) |

Example (least-cost):

```
GET /path/?map=1&mode=fast&startX=1000&startY=2000&endX=5000&endY=6000&maxSlope=15&maxTherm=290&minTherm=200&maxRadiation=0.5&maxWind=20&speed=10
```

Example (science):

```
GET /path/?map=1&mode=science&startX=1000&startY=2000&endX=5000&endY=6000&maxSlope=15&maxTherm=290&minTherm=200&maxRadiation=0.5&maxWind=20&speed=10&h2o=0.8&fe=0.6&si=0.6
```

### Response `200`

```json
{
  "path_data": [
    {
      "Step": 1,
      "X_coordinate": 1000.0,
      "Y_coordinate": 2000.0,
      "Elevation": 1234.5,
      "Slope_Degrees": 3.21,
      "therm": 250.4,
      "H2O": 12.3,
      "Fe": 8.7,
      "Si": 21.0,
      "radiation": 0.31
    }
  ],
  "route_length": 12.34,
  "estimated_time": 1.23,
  "maximum_slope": 14.2,
  "minimum_slope": 0.4,
  "maximum_therm": 288.1,
  "minimum_therm": 210.9,
  "maximum_wind_speed": 18.4,
  "accumulated_cost": 4521.337,
  "max_safe_slope": 15.0
}
```

| Field | Type | Unit | Description |
| --- | --- | --- | --- |
| `path_data` | object[] | – | Ordered waypoints of the route |
| `path_data[].Step` | integer | – | Sequential step index (1..N) |
| `path_data[].X_coordinate` | number | CRS units | Waypoint X |
| `path_data[].Y_coordinate` | number | CRS units | Waypoint Y |
| `path_data[].Elevation` | number | m (raster datum) | Elevation at the cell |
| `path_data[].Slope_Degrees` | number | degrees | Terrain slope at the cell |
| `path_data[].therm` | number | **K** | Temperature at the cell |
| `path_data[].H2O` | number | **%** | Water abundance at the cell |
| `path_data[].Fe` | number | **%** | Iron abundance at the cell |
| `path_data[].Si` | number | **%** | Silicon abundance at the cell |
| `path_data[].radiation` | number | **cps** | Radiation at the cell |
| `route_length` | number | **km** | Total route length (2 decimals) |
| `estimated_time` | number | **hours** | `route_length / speed` (2 decimals) |
| `maximum_slope` | number | degrees | Max slope along the route (2 decimals) |
| `minimum_slope` | number | degrees | Min slope along the route (2 decimals) |
| `maximum_therm` | number | **K** | Max temperature along the route |
| `minimum_therm` | number | **K** | Min temperature along the route |
| `maximum_wind_speed` | number | **m/s** | Max wind along the route |
| `accumulated_cost` | number | – | Dimensionless path cost (3 decimals) |
| `max_safe_slope` | number | degrees | Echo of the `maxSlope` input |

Note: wind is reported only as a route maximum (`maximum_wind_speed`), not per
waypoint.

### Cost model

Each raster cell is assigned a cost:

```
total = 1
      + 100 * clip(slope_deg / maxSlope, 0, 1)^2
      +  50 * (1 - clip((therm - minTherm) / (maxTherm - minTherm), 0, 1))^2
      +  50 * clip(radiation / maxRadiation, 0, 1)^2
      +  50 * clip(wind / maxWind, 0, 1)^2
      + science mode only:
         100 * (1 - (h2o_w * H2O_norm + fe_w * Fe_norm + si_w * Si_norm))^2
```

Cells that violate any hard limit (slope, temperature, radiation, wind, or
missing data) are blocked. The path is the minimum-cost route
(`skimage.graph.route_through_array`, fully connected).

### Errors

Errors are raised as uncaught exceptions and, with `DEBUG=True`, return an
HTTP 500 debug page (not JSON). Typical causes:

- `map` missing / unknown → `Map.DoesNotExist`
- `startX/startY/endX/endY` outside the raster → "Start/End coordinate is outside the raster."
- start or end on a nodata cell → "Start/End point has missing elevation."
- start or end exceeds limits → "Start/End point exceeds the slope limit ... or the temperature ..."
- no cell passes the safety limits → "No traversable terrain found."
- no valid elevation data → "No valid elevation data found in the TIF."
- `speed=0` → `ZeroDivisionError`
- missing / non-numeric numeric params → `TypeError` / `ValueError`

---

## GET `/vehicles/`

Returns every vehicle record. No parameters, no pagination.

### Request

```
GET /vehicles/
```

### Response `200`

```json
[
  {
    "id": 1,
    "name": "Perseverance-class",
    "description": "Long-range science rover",
    "photo": "http://host/static/rover.png",
    "maxSpead": 10.0,
    "maxRad": 0.5,
    "maxEle": 3000.0,
    "maxTherm": 290.0,
    "maxWind": 20.0,
    "minTherm": 200.0
  }
]
```

| Field | Type | Unit | Description |
| --- | --- | --- | --- |
| `id` | integer | – | Vehicle id |
| `name` | string | – | Vehicle name |
| `description` | string \| null | – | Description |
| `photo` | string \| null | – | Photo URL |
| `maxSpead` | number | km/h | Max speed (feeds `speed` in `/path/`) |
| `maxRad` | number | **cps** | Max safe radiation (feeds `maxRadiation`) |
| `maxEle` | number | m | Max elevation (raster datum) |
| `maxTherm` | number | **K** | Max safe temperature (feeds `maxTherm`) |
| `minTherm` | number | **K** | Min safe temperature (feeds `minTherm`) |
| `maxWind` | number | **m/s** | Max safe wind (feeds `maxWind`) |

Note: the model field is spelled `maxSpead` (not `maxSpeed`); the API returns it
as-is. Values returned here are intended to be passed straight back to
`/path/` as its safety-limit query parameters.

---

## Static assets

Basemaps and rasters are served from `/static/`. Each map region provides a PNG
basemap plus seven GeoTIFF layers used by the routing engine:

`Ele` (elevation), `Therm` (thermal, K), `Rad` (radiation, cps),
`Fe` (iron, %), `H2O` (water, %), `Si` (silicon, %), `Wind` (wind, m/s).
