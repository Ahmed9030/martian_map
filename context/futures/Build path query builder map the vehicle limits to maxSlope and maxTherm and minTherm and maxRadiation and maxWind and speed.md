You are working in the "martian_map" repo (Next.js 16 App Router + TypeScript + Tailwind v4, pnpm). Work ONLY inside /frontend.

## Task
Build a `/path/` query builder: a typed utility that turns a selected Vehicle (from GET /vehicles/) plus user inputs into a valid URL for GET /path/ on the Django API.

## Step 0 – Check existing work first
Before writing code, search /frontend for any existing API client, env config, types, or path-building code (grep: "path/", "vehicles", "NEXT_PUBLIC", "buildPath"). Reuse the API base URL env variable that was already set up in the previous task (https://raheemelnashar.pythonanywhere.com). Do NOT hardcode the URL. Report what already exists before continuing.

## Files to create
- `lib/api/types.ts`: Vehicle, PathParams, PathResponse types
- `lib/api/buildPathQuery.ts`: the query builder
- `lib/api/buildPathQuery.test.ts` (or a simple script if no test runner exists)

## Vehicle → /path/ mapping
Vehicle field   → /path/ param
- maxSpead      → speed        (km/h; NOTE the typo in the API field, keep it as-is)
- maxTherm      → maxTherm     (K)
- minTherm      → minTherm     (K)
- maxWind       → maxWind      (m/s)
- maxRad        → maxRadiation
- (no vehicle field) → maxSlope (degrees): must come from user input, default 15 via a named constant `DEFAULT_MAX_SLOPE`. Do NOT map maxEle to it.

## Other params
- map (int, required), startX, startY, endX, endY (numbers in raster CRS units, required)
- mode: "fast" | "science" (anything other than "science" = least-cost on the server)
- step (optional, default 1)
- Only when mode === "science": h2o (default 0.8), fe (default 0.6), si (default 0.6)

## Requirements
1. `buildPathQuery({ mapId, vehicle, start, end, mode, maxSlope?, step?, weights? })` returns a full URL string using URLSearchParams.
2. Throw a clear error (or return a result type with errors) when:
   - any required number is NaN/missing
   - speed <= 0 (backend raises ZeroDivisionError)
   - minTherm >= maxTherm (some vehicle records have inverted values)
3. Do not send science weights in least-cost mode.
4. Add a `fetchPath(url)` helper that handles non-OK responses and non-JSON 500 pages (the API may return an HTML debug page), returning a friendly error message instead of crashing.
5. Strict TypeScript, no `any`. No UI changes in this task.
6. Include a short example usage in a comment, and run `pnpm lint` and `pnpm build` at the end.

## Done when
- Given vehicle {maxSpead:10, maxRad:0.5, maxTherm:290, minTherm:200, maxWind:20} and start/end coordinates, the builder outputs:
  `${BASE}/path/?map=1&mode=fast&startX=...&startY=...&endX=...&endY=...&maxSlope=15&maxTherm=290&minTherm=200&maxRadiation=0.5&maxWind=20&speed=10`
- Lint and build pass.