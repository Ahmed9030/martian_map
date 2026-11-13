# Martian Map

## Frontend setup

The Next.js frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL`.
From the `frontend/` directory, copy `.env.example` to `.env.local`; the
provided value points to the hosted API:

```bash
cd frontend
cp .env.example .env.local
pnpm dev
```

To use a different API, change only `NEXT_PUBLIC_API_BASE_URL` in
`frontend/.env.local`. The value may include a trailing slash; the frontend
normalizes it, so do not include an endpoint path such as `/map/` in this
setting. API calls from the browser go through a same-origin Next.js
rewrite to avoid CORS restrictions; server-side calls use the configured API
directly. If you see a CORS error, verify that calls use the frontend `/api/`
proxy rather than the backend domain. PythonAnywhere may take time to wake up
after inactivity, so retry if a request times out during a cold start.
The alternative is for the backend owner to install `django-cors-headers` and
allow the frontend origin.

For Vercel deployments, set `NEXT_PUBLIC_API_BASE_URL` in the project's
Environment Variables. `NEXT_PUBLIC_*` values are inlined at build time, so
changing this value requires a redeploy.

## File structure

```
martian_map_api (back-end)
├─ maps
│   the main app with urls and services and views
│   
├─ martian_map
│   the root of the project
│   
├─ static
│   all data of the maps
│
├─ README.md (for Installation)
│
martian_map_client (front-end)
│
empty
```