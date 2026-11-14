## Task
Wire up "Science Mode" in the Next.js frontend (Martian Map). The backend already
supports it. The user picks a science target (destination) on the map, and the
frontend calls the backend and renders the returned data in the existing panels.

## Context
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, MapLibre GL.
- Backend (Django, GET-only, no auth): https://raheemelnashar.pythonanywhere.com/
  - GET /map/?map=<id>  -> { title, url (basemap png), coordinates: [[l,t],[r,t],[r,b],[l,b]], destination: [{id,title,description,photo,x_coord,y_coord,map_id}] }
  - GET /vehicles/      -> [{id,name,description,photo,maxSpead,maxRad,maxEle,maxTherm,maxWind,minTherm}]
    (note: `maxSpead` is a typo in the API, use it as-is)
  - GET /path/ params:
      map, mode=science|fast, startX, startY, endX, endY,
      maxSlope (deg), maxTherm (K), minTherm (K), maxWind (m/s),
      speed (km/h), step (optional, route simplification),
      science only: h2o (default 0.8), fe (0.6), si (0.6)
    Response: { path_data: [{Step, X_coordinate, Y_coordinate, Elevation, Slope_Degrees,
      therm, H2O, Fe, Si, Distance_km}], route_length_km, route_length_m,
      estimated_time_hours, maximum_slope, minimum_slope, maximum_therm, minimum_therm,
      maximum_wind_speed, accumulated_cost, mean_Fe, mean_Si, mean_H2O }
- Coordinates (x/y) are in the raster's native CRS units, NOT lng/lat.
- Design reference: context/DESIGN_SYSTEM.md, design/map.pdf (glassmorphism panels,
  Mars orange + cyan telemetry). Use existing components: GlassCard (ui/), TelemetryCard, Button.

## What to build
1. API layer: `lib/api.ts` with typed functions getMap(id), getVehicles(),
   getPath(params). Base URL from `NEXT_PUBLIC_API_URL`. Full TypeScript types for
   all responses. Handle non-JSON / 500 errors (the backend may return an HTML error
   page) and show friendly messages such as "Start point exceeds limits",
   "No traversable terrain found".

2. State (a `useMissionPlanner` hook or a context):
   mapId, selectedVehicle, startPoint, selectedTarget (destination), mode
   ("fast" | "science"), science weights {h2o, fe, si}, route results, loading, error.

3. Map page:
   - Load /map/ and show the Martian basemap (image source + coordinates) instead of
     the demo tiles. Convert/handle CRS coordinates properly so markers and the
     route line line up with the image (e.g. normalize CRS coords into the image
     bounds, or use an image-pixel based coordinate system). Do not assume lng/lat.
   - Render destinations as clickable markers. Clicking one sets it as
     `selectedTarget` and opens the "Science Target" panel
     (title, description, photo, distance from start).
   - Start point: a default rover position or click-to-set on the map.

4. Science Mode controls (floating glass panel):
   - Toggle: Fast (least-cost) / Science.
   - Vehicle selector from /vehicles/. Its limits (maxSpead -> speed, maxTherm,
     minTherm, maxWind, maxRad -> maxRadiation) auto-fill the /path/ params.
     Guard against bad fixture data (e.g. minTherm > maxTherm) with a warning.
   - maxSlope input (degrees).
   - Sliders for h2o / fe / si weights (0-1), visible only in science mode.
   - "Calculate Route" button that calls /path/ with mode=science and
     start = current position, end = selectedTarget.x_coord / y_coord.

5. Display the results in the existing panels:
   - Route Comparison: run both `fast` and `science` in parallel (Promise.all) and
     show them as Route A / Route B: distance (route_length_km),
     time (estimated_time_hours), slope risk (derive Low/Medium/High from
     maximum_slope vs maxSlope).
   - Draw path_data as a polyline on the map (use `step` > 1 to simplify if the
     route is long), with a different color per route.
   - Terrain Profile chart: Distance_km vs Elevation, plus Slope.
   - Temperature chart: Distance_km vs therm.
   - Mineral Composition: mean_H2O, mean_Si, mean_Fe (as %), progress bars.
   - Environmental Conditions: maximum_wind_speed, min/max therm.
   - Telemetry summary: accumulated_cost, maximum_slope, minimum_slope.

6. UX: loading skeletons/spinner while calculating (the route can take a few
   seconds), error toast, and disable the button while a request is in flight.
   Cancel stale requests with AbortController when inputs change.

## Constraints
- Don't change the backend.
- Reuse existing components and design tokens in globals.css; no new UI libraries
  unless necessary (for charts, recharts is fine).
- Keep `components/Map.jsx` working or migrate it to TypeScript.
- Keep everything typed, no `any`.
- At the end, list the files you changed/created and how to test it
  (pnpm dev + which target/vehicle to select).