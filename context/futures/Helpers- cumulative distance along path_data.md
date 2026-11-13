## Task
Implement the "[Data] Helpers" task for the Martian Map frontend (Next.js 16 App Router, TypeScript, React 19, pnpm).

Create pure, reusable data helpers that process the response of the `GET /path/` endpoint. They will be consumed later by the Map page panels (Route Comparison, Mineral Composition, Environmental Conditions).

## Required helpers
1. **Cumulative distance along `path_data`**
   - Return the cumulative distance (km) at each waypoint, starting at 0 for the first point.
   - Compute it from consecutive waypoints (`X_coordinate`, `Y_coordinate`). Coordinates are in the raster CRS units (assume metres, expose the conversion factor as a named constant, e.g. `CRS_UNIT_TO_KM`).
   - Must handle: empty array, single point, and unsorted input is NOT supported (assume `Step` order).
   - Do not mutate the input; return a new array (or the same items with an added field).

2. **Average minerals**
   - Compute the mean of `Fe`, `Si`, `H2O` (%) across `path_data`.
   - Return a typed object `{ fe: number; si: number; h2o: number }`.
   - Return zeros (or a clearly documented fallback) for an empty path; ignore `null`/`NaN` values safely.

3. **Risk level from slope vs `max_safe_slope`**
   - Function takes `slopeDegrees` and `maxSafeSlope` and returns a `RiskLevel`: `"low" | "medium" | "high" | "critical"`.
   - Base it on the ratio `slope / maxSafeSlope`. Put thresholds in one exported config object (e.g. `RISK_THRESHOLDS = { medium: 0.5, high: 0.8, critical: 1 }`) — no magic numbers inside the function.
   - Guard against `maxSafeSlope <= 0` and invalid inputs.
   - Also provide a helper that maps a whole path to its overall (worst) risk level.

## Code quality requirements (very important)
- Clean, readable, and easy to extend. Small single-responsibility functions, descriptive names, no duplicated logic.
- Strict TypeScript: no `any`. Define and export types/interfaces (`PathPoint`, `PathResponse`, `RiskLevel`, `MineralAverages`) matching the API field names exactly (`Step`, `X_coordinate`, `Y_coordinate`, `Elevation`, `Slope_Degrees`, `therm`, `H2O`, `Fe`, `Si`, `Distance_km`).
- Pure functions only: no side effects, no fetching, no React/UI code inside helpers.
- Constants and thresholds in one place, easy to tweak.
- Short JSDoc on each exported function (purpose, params, return, edge cases).
- Structure suggestion:
  - `frontend/lib/path/types.ts`
  - `frontend/lib/path/constants.ts`
  - `frontend/lib/path/distance.ts`
  - `frontend/lib/path/minerals.ts`
  - `frontend/lib/path/risk.ts`
  - `frontend/lib/path/index.ts` (barrel exports)
- Follow the existing code style and ESLint config. Don't add new dependencies.
- Make it easy to add new metrics later (e.g. average temperature) without touching existing helpers.

## Deliverables
- The files above, fully implemented.
- Unit tests (or at least a small examples file) covering: empty path, single point, normal path, invalid slope limit, null mineral values.
- Short summary of what you created and how to import/use each helper.

Before coding, briefly read the existing frontend structure and conventions, and tell me if anything is ambiguous instead of guessing.
