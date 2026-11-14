## Context
Project: "Martian Map" (Next.js App Router + TypeScript + MapLibre GL JS frontend, Django API backend).
API docs are in martian_map_api/README.md. Relevant endpoints:
- GET /map/?map=<id> → { title, url, coordinates (4 corners in raster CRS units), destination[] (x_coord, y_coord, title, ...) }
- GET /vehicles/ → vehicle limits (maxSpead, maxTherm, minTherm, maxWind, ...)
- GET /path/?map&mode&startX&startY&endX&endY&maxSlope&maxTherm&minTherm&maxWind&speed&step[&h2o&fe&si]

## Current behavior
On the Map page, the user can only pick Start/End by selecting the destination points (the yellow markers) that come from /map/.

## Required change
Keep the yellow destination markers working exactly as they do now, AND add a second way to choose points: clicking anywhere on the map.

### Behavior
1. Add a "pick mode" for route points. Click flow:
   - 1st click on the map (not on a marker) → sets START.
   - 2nd click → sets END.
   - 3rd click → resets and starts a new selection (START = this click, END cleared).
2. Clicking a yellow destination marker must still set Start/End (same state, same flow). Marker clicks must NOT also trigger the map click handler (stopPropagation).
3. Show custom markers for the clicked Start and End, visually different from the yellow destination markers (e.g. green for Start, red for End, with "S"/"E" labels). Both selection methods must render through the same Start/End state.
4. Add a small UI (in the existing glass panel style) showing the selected Start and End coordinates, a "Clear" button, and a "Calculate Route" button (disabled until both points exist).
5. Allow dragging the Start/End markers to fine-tune them (nice-to-have).

### Coordinate conversion (IMPORTANT)
The API works in the raster's native CRS units, not lng/lat. The click event from MapLibre gives lng/lat (or whatever the image-source coordinate space is).
- First inspect how the map currently places the basemap image (image source with the 4 corners) and how destination x_coord/y_coord are converted to map positions.
- Create a single utility (e.g. lib/coords.ts) with two functions: `mapToCrs(lngLat, bounds)` and `crsToMap(x, y, bounds)` using the /map/ bounds, and use the SAME functions for destinations and clicks so they stay consistent.
- Send startX/startY/endX/endY to /path/ in CRS units only.
- Reject clicks outside the basemap bounds (show a small toast/message).

### Backend call
- Create an API client (lib/api.ts) with `getRoute(params)` using fetch to /path/ with URLSearchParams. Base URL from env var NEXT_PUBLIC_API_URL.
- Params: map id, mode (fast | science), start/end, and vehicle limits taken from the selected vehicle (maxSpead → speed, maxTherm, minTherm, maxWind) plus maxSlope; step optional; h2o/fe/si only in science mode.
- Note: the vehicle field is spelled `maxSpead` in the API. Do not "fix" it on the client.
- Handle loading, and errors (the API may return a 500 HTML/debug page instead of JSON for invalid points, blocked terrain, or speed=0). Wrap in try/catch, validate that the response is JSON, and show a readable error message.
- On success, draw path_data as a LineString layer on the map and store the stats (route_length_km, estimated_time_hours, maximum_slope, maximum_therm, minimum_therm, maximum_wind_speed, mean_Fe/Si/H2O) in state for the side panels (Route Comparison, Environmental Conditions, Mineral Composition, Terrain Profile). Do not hardcode sample values.

### Constraints
- Keep the existing design system (glassmorphism, Mars orange/cyan) and components in components/ui.
- Keep types strict (TypeScript), define types for Map, Destination, Vehicle, RouteResponse.
- Don't break the existing destination selection flow.
- Keep changes minimal and explain which files were changed.

## Deliverable
Working click-to-select Start/End + destination marker selection, both feeding the same state and calling /path/, with the result drawn on the map.