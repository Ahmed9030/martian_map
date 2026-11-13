# Task: Implement ONLY the "Mineral Composition" panel and connect it to the API

## Context
Project: Martian Map (Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, pnpm).
Backend: Django GET-only API. Base URL comes from `process.env.NEXT_PUBLIC_API_URL`
(public host: https://raheemelnashar.pythonanywhere.com).

The design (design/map.pdf) has a "Mineral Composition" card with 3 progress bars:
- Water (H₂O)  -> blue bar
- Silicon (Si) -> green/teal bar
- Iron (Fe)    -> orange bar
Each row shows: label on the left, percentage on the right, bar underneath.
Footer text: "Data source: MRO (CRISM)".

## Data source (already exists in the API, do NOT change the backend)
`GET /path/?map=<id>&startX=..&startY=..&endX=..&endY=..&maxSlope=..&maxTherm=..&minTherm=..&maxWind=..&speed=..`
Response fields to use (all in %):
- `mean_H2O`
- `mean_Si`
- `mean_Fe`
(Optional: `path_data[]` also has per-waypoint `H2O`, `Si`, `Fe`, but use the `mean_*` fields.)

## Requirements
1. Create a presentational component `frontend/components/ui/MineralComposition.tsx`
   - Props: `{ h2o: number; si: number; fe: number; source?: string; isLoading?: boolean }`
   - Wrap it in the existing `components/ui/GlassCard.tsx` (NOT `components/GlassCard.tsx`).
   - Reuse the existing design tokens in `app/globals.css` / Tailwind classes; do not add new global CSS.
   - Clamp values to 0–100 and format to a whole number (e.g. `52%`).
   - Define the 3 minerals as a typed config array (label, key, color class) and `.map()` over it, with no copy-pasted JSX.
   - Add a loading skeleton and a "no data" state (when values are null/NaN).
   - Accessible: use `role="progressbar"` with `aria-valuenow/min/max` and `aria-label`.

2. Create a small typed API helper `frontend/lib/api/mineralComposition.ts`
   - Export a `MineralComposition` type `{ h2o: number; si: number; fe: number }`.
   - Export `getMineralComposition(params): Promise<MineralComposition>` that calls `/path/`, checks `response.ok`, and maps `mean_H2O/mean_Si/mean_Fe` to the type above.
   - Handle errors (the API may return 500 for blocked/invalid points) by throwing a clear Error message.
   - No hardcoded URLs: read `NEXT_PUBLIC_API_URL` and add it to `.env.example` if that file exists.

3. Wire it into the Map page
   - Use the already-computed route result if the page has one; otherwise add the minimum state/effect needed to call `getMineralComposition` and pass the values down.
   - Place the card in the bottom-right of the dashboard like the design.

## Strict constraints
- Do NOT modify or refactor anything unrelated: no changes to Navbar, Map.jsx, other cards, routes, backend, package.json, or configs.
- No new dependencies.
- Clean code: small single-purpose functions, meaningful names, no `any`, no dead code, no console.logs, no magic numbers (use named constants), strict TypeScript.
- Do not hardcode the sample values from the design (52 / 60 / 20); they are placeholders only.

## Deliverable
List the files you created/changed, and make sure `pnpm lint` and `pnpm build` pass.