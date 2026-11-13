## Task: Configure environment variables (API base URL) for the frontend and verify it works against the hosted API

### Context
Project: "Martian Map" (NASA Space Apps – Mars). Monorepo with:
- `frontend/` — Next.js 16.4.3 (App Router), React 19, TypeScript, Tailwind v4, MapLibre GL, pnpm.
- `martian_map_api/` — Django API (GET-only, no auth), ALREADY DEPLOYED by a teammate at:
  https://raheemelnashar.pythonanywhere.com
  Endpoints: `GET /map/?map=<id>`, `GET /path/?...`, `GET /vehicles/`
  Example: https://raheemelnashar.pythonanywhere.com/map/?map=1

We do NOT run the backend locally for this task. The frontend currently uses demo tiles in `components/Map.jsx` and is not connected to the API. This task only sets up configuration and verifies connectivity. Do NOT build the Map page UI.

### Goal
The frontend reads the API base URL from a single env variable and successfully fetches data from the hosted API. Switching to another API (local or production) must require changing only that variable.

### Steps
1. Frontend env
   - Create `frontend/.env.example` with:
     NEXT_PUBLIC_API_BASE_URL=https://raheemelnashar.pythonanywhere.com
   - Create `frontend/.env.local` with the same value (make sure `.env*.local` is gitignored; don't commit secrets).
   - The base URL must have NO trailing slash. Normalize it in code anyway.

2. API client
   - Create `frontend/lib/api.ts` exporting `API_BASE_URL` (from `process.env.NEXT_PUBLIC_API_BASE_URL`, throw a clear error if missing) and typed helpers: `getMap(id)`, `getVehicles()`, `getPath(params)`.
   - Keep the `maxSpead` typo as-is in the Vehicle type (the API returns it that way).
   - Handle non-200 responses and network errors with clear error messages. The API returns JSON errors, including a JSON 404.
   - No hardcoded URLs anywhere else in the code.

3. CORS check (important)
   - Browser calls from http://localhost:3000 to the PythonAnywhere domain may be blocked by CORS.
   - Check first: `curl -i -H "Origin: http://localhost:3000" https://raheemelnashar.pythonanywhere.com/vehicles/` and look for an `Access-Control-Allow-Origin` header.
   - If the header is present: call the API directly from the client.
   - If absent: do NOT modify the backend (it belongs to a teammate). Either call the API from Server Components/Route Handlers, or add a `rewrites()` proxy in `next.config.ts` (e.g. `/api/:path*` → the API base URL). Pick one, explain why, and note that the alternative is asking the backend owner to add `django-cors-headers`.

4. Verify
   - `curl` the endpoints: `/vehicles/`, `/map/?map=1`. Confirm they return valid JSON.
   - Run `cd frontend && pnpm install && pnpm dev`.
   - Add a temporary dev-only check (e.g. a Server Component or a log) that calls `getVehicles()` and `getMap(1)` and shows the result or the error. Remove it after verifying, or leave it clearly marked as dev-only.
   - Run `pnpm lint` and `pnpm build`.

5. Docs
   - Add a "Frontend setup" section to the root README.md: copy `.env.example` to `.env.local`, the variable's meaning, how to point at a different API, `pnpm dev` command, and troubleshooting (CORS error, API timeout/cold start on PythonAnywhere, wrong trailing slash).

### Deployment note (document only)
In Vercel, set `NEXT_PUBLIC_API_BASE_URL` in the project's Environment Variables. Remember that `NEXT_PUBLIC_*` values are inlined at build time, so a change requires a redeploy.

### Acceptance criteria
- [ ] `frontend/.env.example` exists; `.env.local` is gitignored
- [ ] Changing `NEXT_PUBLIC_API_BASE_URL` is the only thing needed to switch API
- [ ] `/vehicles/` and `/map/?map=1` return valid JSON through the frontend helpers
- [ ] No CORS errors in the browser console
- [ ] `pnpm lint` and `pnpm build` pass
- [ ] README updated

### Constraints
- Don't change the backend or the API response shapes/field names.
- Use pnpm only (don't touch package-lock.json).
- Small, reviewable commits.