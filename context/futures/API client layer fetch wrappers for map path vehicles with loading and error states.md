You are working in the "Martian Map" repo (Next.js 16 App Router, React 19, TypeScript, Tailwind v4, pnpm). Read frontend/AGENTS.md and context/DESIGN_SYSTEM.md first, and follow any conventions there.

## Task
Build the API client layer in the frontend: typed fetch wrappers for the Django API endpoints /map/, /path/, and /vehicles/, plus React hooks that expose loading and error states. Do NOT build any UI or touch Map.jsx yet. This layer is what the Map page will consume later.

## API facts (source of truth)
- Base URL from env: NEXT_PUBLIC_API_BASE_URL (default https://raheemelnashar.pythonanywhere.com). Add it to .env.example.
- All endpoints are GET-only, no auth, return JSON.
- GET /map/?map=<int>
  Response: { title: string, url: string, coordinates: [number, number][] (4 corners: [left,top],[right,top],[right,bottom],[left,bottom]), destination: Destination[] }
  Destination: { id, title, description: string|null, photo: string|null, x_coord, y_coord, map_id: number|null }
- GET /vehicles/ (no params, no pagination)
  Response: Vehicle[] where Vehicle = { id, name, description: string|null, photo: string|null, maxSpead (sic, keep as-is in the raw type), maxRad, maxEle, maxTherm, maxWind, minTherm }
- GET /path/
  Required params: map, startX, startY, endX, endY, maxSlope (deg), maxTherm (K), minTherm (K), maxWind (m/s), speed (km/h, must be > 0)
  Optional: mode ("science" | anything else = least-cost; use "fast" | "science" in our types), step (default 1), h2o (0.8), fe (0.6), si (0.6) (the last three only in science mode)
  Response: { path_data: PathPoint[], route_length_km, route_length_m, estimated_time_hours, maximum_slope, minimum_slope, maximum_therm, minimum_therm, maximum_wind_speed, accumulated_cost, mean_Fe, mean_Si, mean_H2O }
  PathPoint: { Step, X_coordinate, Y_coordinate, Elevation, Slope_Degrees, therm, H2O, Fe, Si, Distance_km }
- Units: temperature K, wind m/s, length km/m, time hours, Fe/Si/H2O in %, slope in degrees, coordinates in the map's raster CRS units (NOT lat/lng). Add unit comments in the types.

## Known API quirks to handle
1. Errors from /path/ may arrive as a JSON error body OR as an HTML 500 debug page (Django DEBUG=True). Never call res.json() blindly: check res.ok and content-type, and fall back to a generic message with the HTTP status.
2. Known server error messages worth mapping to friendly text: "Start/End coordinate is outside the raster", "Start/End point has missing elevation", "exceeds the slope limit / temperature", "No traversable terrain found", "No valid elevation data found". Keep the raw message too.
3. Unknown map id -> Map.DoesNotExist (500 or custom JSON 404). Treat 404 and 500 distinctly where possible.
4. The README example for /path/ includes maxRadiation but the params table does not list it. Make maxRadiation an optional param in the type and only send it if provided, and leave a TODO comment flagging this doc inconsistency.
5. The vehicle field is spelled maxSpead. Keep the raw API type faithful, and add a mapper that exposes a normalized Vehicle { maxSpeed, ... } for UI use, plus a helper vehicleToPathParams(vehicle) that maps maxSpead -> speed, maxTherm, minTherm, maxWind (values are intended to be passed straight back to /path/).
6. /path/ is compute-heavy and can be slow. Support AbortSignal so stale requests are cancelled, and a configurable timeout (default 60s).
7. Check whether the Django API sends CORS headers. If it doesn't, don't silently work around it: tell me, and propose either django-cors-headers on the backend or a Next.js rewrite/route-handler proxy (/api/martian/*). Implement the base-URL layer so switching to a proxy is a one-line change.

## Deliverables (suggested structure)
frontend/lib/api/
  config.ts      - base URL, default timeout
  types.ts       - all request/response types above
  errors.ts      - ApiError class { status, kind: "network"|"timeout"|"aborted"|"http"|"parse"|"api", message, details? } + friendly message mapper
  client.ts      - generic apiGet<T>(path, params, { signal, timeoutMs }) that builds the query string (skip undefined/null), handles the quirks above, and throws ApiError
  endpoints.ts   - getMap(mapId, opts), getVehicles(opts), getPath(params, opts)
  mappers.ts     - vehicle normalization + vehicleToPathParams
frontend/hooks/
  useAsync.ts    - small shared state machine: { status: "idle"|"loading"|"success"|"error", data, error }
  useMapData.ts  - useMapData(mapId) -> { data, status, isLoading, error, refetch }
  useVehicles.ts - same shape, fetched once and cached in module scope
  usePath.ts     - imperative: const { run, data, status, isLoading, error, reset } = usePath(); run(params) cancels any in-flight request via AbortController and ignores stale responses
Also add a tiny client-side validation step in getPath before the request (all required params present and numeric, speed > 0, minTherm < maxTherm) that throws an ApiError(kind: "http"-like validation) with a clear message, so we avoid pointless slow calls.

## Requirements
- Strict TypeScript, no `any`. Hooks are "use client". No new dependencies unless truly needed (no axios/SWR/React Query; native fetch only).
- Cleanup on unmount (abort in-flight requests, no state updates after unmount, handle React 19 StrictMode double-invoke).
- Loading and error states must be exposed so the UI can show skeletons and error toasts later; do not render UI here.
- Add unit tests for client.ts, errors, and mappers if a test runner exists in the repo; otherwise skip and say so.
- Do not modify existing components. Run pnpm lint and pnpm build at the end and fix any issues.

## Output
When done, summarize: files created, public API of each hook with a short usage example, CORS finding, and any assumptions or doc inconsistencies you found.