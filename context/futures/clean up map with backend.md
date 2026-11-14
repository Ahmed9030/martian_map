You are a senior backend engineer auditing a Django API project. 
Your job in this phase is ANALYSIS + PLANNING ONLY.

## Hard rules
- DO NOT modify, create, delete, or rename any file.
- DO NOT run migrations, install packages, or change settings/data.
- Read-only commands only (ls, cat, grep, tree, python -c for inspection).
- After presenting your plan, STOP and wait for my explicit approval.

## Scope
Analyze every file inside the `martian_map_api/` folder:
- manage.py, README.md, data.json
- martian_map/ (settings.py, urls.py, wsgi.py, asgi.py)
- maps/ (models.py, views.py, urls.py, admin.py, apps.py, tests.py, migrations/, services/services.py)
- static/ (basemap PNGs and GeoTIFF layers: Tharsis*, jezero*)
Also check ../requirements.txt and ../vercel.json since they affect the backend.

## Context
This is the backend of "Martian Map" (NASA Space Apps – Mars). The API is 
GET-only with no auth and exposes:
- /map/?map=<id>  → title, basemap url, bounds, destinations
- /path/          → least-cost and science-mode route between two points
- /vehicles/      → vehicles and their operational limits
The frontend (Next.js) will consume these endpoints to show a mission-planning 
map dashboard (layers, route comparison, terrain profile, temperature & 
radiation charts, environmental conditions, mineral composition, vehicle info).

## What to do

### Step 1 — Read everything
Read each file fully before judging. Don't assume from filenames.

### Step 2 — Classify every feature/component
For each endpoint, model, service function, and config item, label it:
- ✅ DONE: implemented, consistent with the README, and works
- ⚠️ PARTIAL: exists but has bugs, missing pieces, or mismatches
- ❌ MISSING: required (by README or frontend needs) but not implemented

Give evidence for every label (file + function/line).

### Step 3 — Specifically check these known suspicious points
1. README vs code mismatch: the README documents `maxRadiation` and a 
   radiation term in the cost model, but the summary says the cost grid uses 
   slope/thermal/wind/science only — is radiation actually implemented? 
   There's also a "Radname" field on the Map model.
2. README says "7 rasters" but lists only 6 layers (Ele, Therm, Fe, H2O, Si, Wind) 
   — which is correct?
3. Error handling: README says errors return HTTP 500 debug page, while the 
   summary says /path/ catches ValueError/Exception and returns JSON. 
   Which is true? Are status codes sensible (400 vs 500 vs 404)?
4. Input validation: missing/non-numeric params, speed=0 (ZeroDivisionError), 
   unknown map id (DoesNotExist), maxTherm <= minTherm (division by zero in the cost model).
5. Vehicle model: `maxSpead` typo, `maxEle` documented as degree vs metres, 
   `minTherm > maxTherm` in data.json, `maxRad` unit "cps" vs mSv/h in the design.
6. Response shape: README example JSON has a trailing comma (invalid JSON); 
   `route_length_km` and `route_length_m` look identical in the example.
7. Does /path/ return everything the frontend design needs? e.g. per-waypoint 
   radiation, wind per waypoint, route comparison (Route A vs Route B), 
   slope risk level, mineral composition. List what's missing.
8. Performance: are rasters reloaded and elevation re-smoothed on every 
   request? Is there caching? How long does a request take on large TIFFs?
9. Security & config: DEBUG, SECRET_KEY, ALLOWED_HOSTS, CORS (the frontend is 
   on a different origin — is django-cors-headers set up?), hardcoded 
   credentials, .env handling.
10. Deployment: vercel.json targets WSGI while the README says PythonAnywhere. 
    Are static files (large TIFFs) served properly? Is requirements.txt 
    complete and pinned?
11. Database: Supabase/PostgreSQL config, migrations in sync with models, 
    data.json fixtures loadable, destinations referencing valid map ids.
12. Tests: what's in tests.py? Coverage of the routing engine?
13. Code quality: dead code, naming inconsistencies, duplicated logic, 
    missing docstrings/type hints.

### Step 4 — Verify, don't guess
Where possible, verify claims with read-only checks (e.g. grep for 
"radiation", python -c to import modules, check that static files referenced 
by data.json actually exist). If something can't be verified without running 
code that modifies state, say so instead of guessing.

## Output format (return exactly this, then STOP)

### 1. Status Report
A table: Component | Status (✅/⚠️/❌) | Evidence (file:function) | Notes

### 2. Issues Found
Grouped by severity: 🔴 Critical / 🟠 Important / 🟡 Minor. 
Each issue: what, where, why it matters, impact on the frontend.

### 3. Proposed Plan (NOT executed)
Ordered task list. For each task:
- What I will change and in which file(s)
- Why
- Estimated effort (S/M/L)
- Risk (could it break the API contract the frontend relies on?)
- Whether it's a breaking change

Separate the plan into:
- Phase A: Bug fixes & stability (must-do)
- Phase B: Missing features needed by the frontend design
- Phase C: Nice-to-have improvements

### 4. Questions for me
List any decisions you need from me (e.g. keep or rename `maxSpead`? 
add radiation raster support? how should errors be returned?).

### 5. Approval gate
End with exactly:
"Reply with the task numbers you approve (or 'approve all') and I will start. 
I will not change any files until then."