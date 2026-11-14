# Martian Map API

Django-based HTTP API that serves Martian map imagery, destination points, rover
data, computes safe route plans over Martian terrain rasters, and records
per-astronaut mission logs ("visits").

- API public host: <a href="https://raheemelnashar.pythonanywhere.com/">Here</a>

- Framework: **Django 6** (plain Django views returning `JsonResponse`)
- Entry point: `manage.py` (dev: `python manage.py runserver`)
- URL config: `martian_map/urls.py` (mounts `maps.urls` at the site root)
- Views: `maps/views.py`
- Route engine / helpers: `maps/services/services.py`

Responses are `application/json` (except `GET /revisit/`, which redirects unless
`format=json` is requested). There is no authentication. Query parameters are
passed as strings and cast inside the services layer.

---

## Units of measure

The entire API uses the following fixed units.

| Quantity | Unit | Symbol |
| --- | --- | --- |
| Temperature (thermal raster, `therm`, `minTherm`, `maxTherm`) | **Kelvin** | K |
| Wind speed (`maxWind`, `Wind`, `maximum_wind_speed`, `mean_wind_speed`) | **metres per second** | m/s |
| Route length (`route_length_km`) | **kilometres** | km |
| Route length (`route_length_m`) | **metres** | m |
| Estimated time (`estimated_time`, `estimated_time_hours`) | **hours** | h |
| Silicon abundance (`Si`) | **percent** | % |
| Water abundance (`H2O`) | **percent** | % |
| Iron abundance (`Fe`) | **percent** | % |

Notes:

- Coordinates (`X_coordinate`, `Y_coordinate`, `x_coord`, `y_coord`, and the
  bound polygon) are expressed in the map's raster CRS units (the map GeoTIFF's
  native coordinate system). Both bundled maps use a Mars Equirectangular
  projection in **metres**.
- `Slope_Degrees` / `maximum_slope` / `minimum_slope` / `maxSlope` are in
  **degrees**.
- `speed` is provided in **km/h** so that `estimated_time = route_length (km) / speed (km/h)` is in **hours**.
- `maxEle` is a legacy vehicle field name. The routing engine treats it as a
  **maximum slope in degrees** (the frontend sends it as `maxSlope`). It is not
  an elevation limit.
- The thermal GeoTIFFs are 8-bit images. The service scales them linearly to
  `160 K … 315 K` (`MAP_MIN_TEMP_K` / `MAP_MAX_TEMP_K` in `services.py`).
- Radiation is **not implemented**: there is no radiation raster and
  `Map.Radname` is unused. `Vehicle.maxRad` is a legacy column kept in the
  database but never read by the API; recorded flights store the sentinel
  `9999`. The path endpoint no longer accepts a `maxRadiation` parameter.

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
  "title": "Tharsis Chryse Corridor",
  "url": "http://host/static/TharsisMap.png",
  "coordinates": [
    [-2682075.1, 1700376.3],
    [2678370.6, 1700376.3],
    [2678370.6, -1148402.3],
    [-2682075.1, -1148402.3]
  ],
  "destination": [
    {
      "id": 9,
      "title": "Olympus Mons",
      "map_id_id": 1,
      "description": "Towering three times taller than Mt Everest...",
      "photo": "https://trek.nasa.gov/img/galleries/vrlibrary/OlympusMonsScreenshot.jpg",
      "x_coord": -2456269.08,
      "y_coord": 1105320.81
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
| `destination[].map_id_id` | integer \| null | – | Owning map id. This is the raw Django FK column name produced by `QuerySet.values()`; it is **not** `map_id`. |

Destinations are returned in database order (no explicit ordering is applied).

---

## GET `/path/`

Computes a route between two points across the map rasters and returns the path
waypoints plus aggregate statistics. When a known profile `token` is supplied,
the route is recorded as a visit (see `/flights/`).

Two modes:

- **least-cost** (default): minimises terrain cost (slope, temperature, wind).
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
| `maxWind` | number | m/s | yes | Maximum safe wind speed |
| `speed` | number | km/h | yes | Rover speed, used for `estimated_time_hours` |
| `step` | number | – | no | Return every Nth waypoint (default `1`; must be ≥ 1) |
| `token` | uuid | – | no | Profile token; records the visit when valid |
| `record` | 0 \| 1 | – | no | `0` disables visit recording (used when replaying a visit) |

Science-mode-only parameters:

| Param | Type | Unit | Required | Description |
| --- | --- | --- | --- | --- |
| `h2o` | number | – | no | Weight of water abundance in the resource score (default `0.8`) |
| `fe` | number | – | no | Weight of iron abundance (default `0.6`) |
| `si` | number | – | no | Weight of silicon abundance (default `0.6`) |

Invalid weights (e.g. `h2o=x`) silently fall back to the defaults.

Example (least-cost):

```
GET /path/?map=1&mode=fast&startX=1000&startY=2000&endX=5000&endY=6000&maxSlope=15&maxTherm=290&minTherm=200&maxWind=20&speed=10
```

Example (science):

```
GET /path/?map=1&mode=science&startX=1000&startY=2000&endX=5000&endY=6000&maxSlope=15&maxTherm=290&minTherm=200&maxWind=20&speed=10&h2o=0.8&fe=0.6&si=0.6
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
      "max_therm": 250.4,
      "min_therm": 200.45,
      "Wind": 4.2,
      "H2O": 12.3,
      "Fe": 8.7,
      "Si": 21.0,
      "Distance_km": 0.0
    }
  ],
  "route_length_km": 12.34,
  "route_length_m": 12340.0,
  "estimated_time_hours": 1.23,
  "mean_Fe": 4.7,
  "mean_Si": 2.4,
  "mean_H2O": 5.8,
  "mean_therm": 230.1,
  "mean_wind_speed": 4.9,
  "maximum_slope": 14.2,
  "minimum_slope": 0.4,
  "maximum_therm": 288.1,
  "minimum_therm": 210.9,
  "maximum_wind_speed": 18.4,
  "accumulated_cost": 4521.337
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
| `path_data[].min_therm` | number | **K** | Night-side temperature at the cell |
| `path_data[].max_therm` | number | **K** | Day-side temperature at the cell |
| `path_data[].Wind` | number | **m/s** | Wind speed at the cell |
| `path_data[].H2O` | number | **%** | Water abundance at the cell |
| `path_data[].Fe` | number | **%** | Iron abundance at the cell |
| `path_data[].Si` | number | **%** | Silicon abundance at the cell |
| `path_data[].Distance_km` | number | **km** | Distance from the start point to this cell |
| `route_length_km` | number | **km** | Total route length (2 decimals) |
| `route_length_m` | number | **m** | Total route length (2 decimals) |
| `estimated_time_hours` | number | **hours** | `route_length_km / speed` (2 decimals; `0.0` when `speed <= 0`) |
| `mean_Fe` | number | **%** | Mean iron abundance along the route |
| `mean_Si` | number | **%** | Mean silicon abundance along the route |
| `mean_H2O` | number | **%** | Mean water abundance along the route |
| `mean_therm` | number | **K** | Mean of `(max_therm + min_therm) / 2` over all route cells |
| `mean_wind_speed` | number | **m/s** | Mean wind along the route |
| `maximum_slope` | number | degrees | Max slope along the route (2 decimals) |
| `minimum_slope` | number | degrees | Min slope along the route (2 decimals) |
| `maximum_therm` | number | **K** | Max day-side temperature along the route |
| `minimum_therm` | number | **K** | Min night-side temperature along the route |
| `maximum_wind_speed` | number | **m/s** | Max wind along the route |
| `accumulated_cost` | number | – | Dimensionless path cost (3 decimals) |

`Distance_km` is cumulative distance from the start cell. When `step > 1`,
waypoints are sub-sampled (the final waypoint is always included) but the
`route_length_*`, `mean_*` and `maximum_*` statistics still cover the full path.

### Cost model

Each raster cell is assigned a cost:

```
total = 1
      + 100 * clip(slope_deg / maxSlope, 0, 1)^2
      +  50 * 0.5 * ( day_penalty^2 + night_penalty^2 )
      +  50 * clip(wind / maxWind, 0, 1)^2
      + science mode only:
         100 * (1 - (h2o_w * H2O_norm + fe_w * Fe_norm + si_w * Si_norm))^2
```

where

```
day_penalty   = 1 - clip((therm_day   - minTherm) / (maxTherm - minTherm), 0, 1)
night_penalty = 1 - clip((therm_night - minTherm) / (maxTherm - minTherm), 0, 1)
```

There is **no radiation term**. Cells that violate any hard limit (slope,
wind, day- or night-side temperature, or missing elevation) are blocked. The
path is the minimum-cost route (`skimage.graph.route_through_array`, fully
connected, geometric distance).

### Errors

`ValueError` raised by the routing service is returned as **HTTP 400** with a
JSON body:

```json
{"error": "No traversable terrain found. Check limits."}
```

Any other exception is returned as **HTTP 500**:

```json
{"error": "Path calculation failed: <details>"}
```

Typical causes:

| Situation | Status | Body / message |
| --- | --- | --- |
| `map` missing or unknown → `Map.DoesNotExist` | **500** | Uncaught; Django debug page when `DEBUG=True` (JSON only with `DEBUG=False` + custom 500 handler, not configured) |
| `startX/startY/endX/endY` outside the raster | 400 | `Start/End coordinate (row, col) is outside the raster.` |
| Start or end on a nodata cell | 400 | `Start/End point has missing elevation at (row, col).` |
| Start or end exceeds limits | 400 | `Start/End point exceeds safe operational limits at (row, col).` |
| No cell passes the safety limits | 400 | `No traversable terrain found. Check limits.` |
| No valid elevation data | 400 | `No valid elevation data found in the TIF.` |
| Missing / non-numeric numeric params | 500 | `Path calculation failed: could not convert string to float: ...` |
| `minTherm >= maxTherm` | 400 | Usually `No traversable terrain found. Check limits.` (the cost range is guarded, the mask blocks everything) |
| `step=0` | 400 | `slice step cannot be zero` |
| `speed <= 0` | 200 | Route is returned with `estimated_time_hours: 0.0` |

---

## GET `/vehicles/`

Returns every vehicle record. No parameters, no pagination.

```
GET /vehicles/
```

```json
[
  {
    "id": 1,
    "name": "Multi-Mission Space Exploration Vehicle (MMSEV)",
    "description": "Long-range science rover",
    "photo": "https://host/vehicle.png",
    "maxSpead": 10.0,
    "maxRad": 9999.0,
    "maxEle": 25.0,
    "maxTherm": 394.0,
    "maxWind": 44.0,
    "minTherm": 130.0
  }
]
```

| Field | Type | Unit | Description |
| --- | --- | --- | --- |
| `id` | integer | – | Vehicle id |
| `name` | string | – | Vehicle name |
| `description` | string \| null | – | Description |
| `photo` | string \| null | – | Photo URL |
| `maxSpead` | number | km/h | Max speed (feeds `speed` in `/path/`). The spelling is a legacy typo; the API returns it as-is. |
| `maxRad` | number | – | Legacy radiation field. Kept for the database but **not used** by `/path/`. Fixture data stores `9999`; treat it as a sentinel, not a limit. |
| `maxEle` | number | degrees | Legacy name; used as `maxSlope` (maximum slope) in `/path/`. |
| `maxTherm` | number | **K** | Max safe temperature (feeds `maxTherm`) |
| `minTherm` | number | **K** | Min safe temperature (feeds `minTherm`) |
| `maxWind` | number | **m/s** | Max safe wind (feeds `maxWind`) |

Data caveat: the fixture `data.json` contains a Starship record with
`maxTherm=90` and `minTherm=1144` (min > max), which makes every route fail the
temperature mask.

---

## Profiles and visits

Each browser profile is identified by a UUID token stored client-side
(`localStorage` on the frontend).

### POST `/createastro/`

Creates a profile. Form-encoded body; CSRF-exempt.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Display name (max 255 characters) |

```
POST /createastro/
Content-Type: application/x-www-form-urlencoded

name=Ahmed
```

Response `201`:

```json
{"token": "2bf471fd-90f7-4ccb-8958-1ec25c0cac8d", "name": "Ahmed"}
```

Errors: `400 {"error": "Name field is required."}`.

### GET `/flights/`

Lists a profile's recorded visits, newest first.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `token` | uuid | yes | Profile token |

```
GET /flights/?token=2bf471fd-90f7-4ccb-8958-1ec25c0cac8d
```

Response `200`:

```json
{
  "flights": [
    {
      "id": 12,
      "map_id": 2,
      "map_title": "Jezero Center",
      "x_start_coord": -17869.21,
      "y_start_coord": 1096231.55,
      "x_end_coord": -11539.66,
      "y_end_coord": 1117871.78,
      "maxSpeed": 10.0,
      "maxRad": 9999.0,
      "maxEle": 15.0,
      "maxTherm": 249.0,
      "maxWind": 20.0,
      "minTherm": 143.0,
      "mode": null,
      "created_at": "2026-11-14T00:57:58+00:00",
      "estimated_time": 2.89,
      "distance_km": 28.86
    }
  ]
}
```

A visit is written by `GET /path/` when the request carries a valid `token`
and `record` is not `0`. Logging failures never fail the route response.

Errors: `400 {"error": "A valid profile token is required."}` for missing or
malformed tokens.

### GET `/revisit/`

Returns the stored parameters of a visit so it can be replayed.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer | yes | Flight id |
| `format` | `json` | no | Return JSON instead of redirecting |

- Without `format=json` (and without `Accept: application/json`), the endpoint
  responds `302` to `/path/?...` with the stored coordinates and limits.
- With `format=json` it returns the same object shape as one entry of
  `flights[]`.
- Unknown id → `404` (JSON when `DEBUG=False`). Non-numeric id → `400`.

---

## Static assets

Basemaps and rasters are served from `/static/`. Each map region requires a PNG
basemap plus **seven** GeoTIFF layers used by the routing engine:

| Layer | File suffix | Unit |
| --- | --- | --- |
| Elevation | `Ele` | m (raster datum) |
| Day-side thermal | `Day` | 8-bit, scaled to K |
| Night-side thermal | `Night` | 8-bit, scaled to K |
| Iron | `Fe` | % |
| Water | `H2O` | % |
| Silicon | `Si` | % |
| Wind | `Wind` | m/s |

There is no radiation layer. The PNG basemaps referenced by `data.json`
(`TharsisMap.png`, `jezeroMap.png`) must exist in `static/`; they are present on
the current PythonAnywhere host but are not committed to this repository.

Deployment note: the README host (PythonAnywhere) maps `/static/` to
`martian_map_api/static/`. `vercel.json` targets the WSGI entry point instead;
that configuration is untested and does not define static-file serving.
