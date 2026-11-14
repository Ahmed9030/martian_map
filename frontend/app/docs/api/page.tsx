import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";

const clientExample = `"use client";

import { useEffect, useState } from "react";
import { getVehicles, type Vehicle } from "@/lib/api";

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVehicles()
      .then(setVehicles)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  return (
    <ul>
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          {vehicle.name} — max speed {vehicle.maxSpead}
        </li>
      ))}
    </ul>
  );
}`;

const serverExample = `import { getMap, getVehicles } from "@/lib/api";

export default async function MissionPage() {
  const [map, vehicles] = await Promise.all([
    getMap(1),
    getVehicles(),
  ]);

  return (
    <main>
      <h1>{map.title}</h1>
      <p>{map.destination.length} destinations</p>
      <p>{vehicles.length} vehicles available</p>
    </main>
  );
}`;

const pathExample = `import { getPath } from "@/lib/api";

const route = await getPath({
  map: 1,
  startX: -2456269.08,
  startY: 1105320.81,
  endX: 1975467.47,
  endY: -830159.82,
  maxSlope: 15,
  maxTherm: 290,
  minTherm: 200,
  maxWind: 20,
  speed: 10,
  mode: "fast",
});

console.log(route.route_length_km, "km");
console.log(route.estimated_time_hours, "hours");
console.log(route.path_data);`;

function CodeExample({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-black/30 p-4 text-sm leading-6 text-secondary">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="space-y-4">
      <div>
        <p className="text-label font-semibold uppercase tracking-[0.18em] text-mars">
          {eyebrow}
        </p>
        <h2 id={`${id}-heading`} className="mt-1 text-xl font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-label font-semibold uppercase tracking-[0.28em] text-mars">
            Martian Map · Developer guide
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.08em] sm:text-5xl">
            API <span className="text-mars">/</span> DOCS
          </h1>
          <p className="mt-4 text-sm leading-6 text-secondary sm:text-base">
            Configure the API once, then use the typed helpers for maps,
            vehicles, and route calculations. The helpers call the configured
            API origin directly, so browser use requires that API to allow
            cross-origin (CORS) requests from this app.
          </p>
        </header>

        <nav aria-label="Documentation sections" className="flex flex-wrap gap-3">
          {[
            ["configuration", "Configuration"],
            ["api-methods", "API methods"],
            ["map-vehicle-data", "Map & vehicle data"],
            ["path-parameters", "Path parameters"],
            ["path-response", "Path response"],
            ["errors", "Errors"],
            ["server-example", "Server example"],
            ["client-example", "Client example"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              className="rounded-full border border-line px-4 py-2 text-sm text-secondary transition hover:border-mars hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section
          id="configuration"
          eyebrow="One setting"
          title="Configure the API URL"
        >
          <GlassCard className="space-y-4 p-6">
            <p className="text-sm leading-6 text-secondary">
              Copy <code>.env.example</code> to <code>.env.local</code> in
              the <code>frontend/</code> directory. Set{" "}
              <code>NEXT_PUBLIC_API_BASE_URL</code> to the API origin only
              (for example, <code>https://api.example.com</code>), without an
              endpoint path. Trailing slashes are removed automatically.
            </p>
            <CodeExample>{`NEXT_PUBLIC_API_BASE_URL=https://raheemelnashar.pythonanywhere.com`}</CodeExample>
            <p className="text-sm leading-6 text-secondary">
              Restart the dev server after changing the value. In Vercel, add
              the same variable to the project environment and redeploy because
              <code> NEXT_PUBLIC_</code> values are embedded at build time.
            </p>
            <p className="text-sm leading-6 text-secondary">
              The typed helpers request this origin directly in both browser
              and server code. The <code>/api/:path*</code> rewrite in
              <code> next.config.ts</code> is separate and is not used by these
              helpers; configure CORS on the API when calling it from a
              browser.
            </p>
          </GlassCard>
        </Section>

        <Section
          id="api-methods"
          eyebrow="Typed helpers"
          title="Available methods"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                name: "getMap(id)",
                description:
                  "Fetches map metadata, image URL, coordinates, and destinations. Returns MapData.",
                request: "GET /map/?map=1",
              },
              {
                name: "getVehicles()",
                description:
                  "Fetches available vehicles. Returns Vehicle[]. The API field is spelled maxSpead.",
                request: "GET /vehicles/",
              },
              {
                name: "getPath(params)",
                description:
                  "Calculates a route using map coordinates and safety limits. Returns PathData.",
                request: "GET /path/?map=...&startX=...",
              },
            ].map((method) => (
              <GlassCard key={method.name} className="space-y-3 p-5">
                <h3 className="font-mono text-sm font-semibold text-mars">
                  {method.name}
                </h3>
                <p className="text-sm leading-6 text-secondary">
                  {method.description}
                </p>
                <p className="font-mono text-xs text-muted">{method.request}</p>
              </GlassCard>
            ))}
          </div>
          <GlassCard className="space-y-4 p-6">
            <h3 className="font-semibold">Calculate a route</h3>
            <p className="text-sm leading-6 text-secondary">
              Pass a map ID, start/end coordinates in that map&apos;s raster
              coordinate system, and the route safety limits. Although several
              limit fields are optional in the TypeScript interface,{" "}
              <code>getPath</code> requires them at runtime.
            </p>
            <CodeExample>{pathExample}</CodeExample>
          </GlassCard>
          <p className="text-sm leading-6 text-secondary">
            Each helper throws an <code>ApiError</code> for network failures,
            invalid JSON, or non-2xx API responses. Catch the error and show an
            appropriate message to the user. Helpers also accept optional
            <code> signal</code> and <code>timeoutMs</code> request options.
            Types and helpers are exported from{" "}
            <code>@/lib/api</code> as <code>MapData</code>, <code>Vehicle</code>
            , and <code>PathData</code>.
          </p>
        </Section>

        <Section
          id="map-vehicle-data"
          eyebrow="MapData · Vehicle"
          title="Map and vehicle responses"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="space-y-3 p-5">
              <h3 className="font-semibold">MapData from getMap(id)</h3>
              <ul className="space-y-2 text-sm leading-6 text-secondary">
                <li><code>title</code> — map display name.</li>
                <li><code>url</code> — absolute URL for the basemap image.</li>
                <li><code>coordinates</code> — four map-boundary corners in the raster coordinate system.</li>
                <li><code>destination</code> — destination records with <code>id</code>, <code>title</code>, nullable <code>description</code>/<code>photo</code>, <code>x_coord</code>, <code>y_coord</code>, and nullable <code>map_id</code>.</li>
              </ul>
            </GlassCard>
            <GlassCard className="space-y-3 p-5">
              <h3 className="font-semibold">Vehicle from getVehicles()</h3>
              <ul className="space-y-2 text-sm leading-6 text-secondary">
                <li>Each record has <code>id</code>, <code>name</code>, nullable <code>description</code>/<code>photo</code>, and numeric operating limits.</li>
                <li><code>maxSpead</code> is the API&apos;s existing spelling; it represents speed in km/h.</li>
                <li><code>maxTherm</code>/<code>minTherm</code> are in K; <code>maxWind</code> is in m/s.</li>
                <li><code>maxRad</code> and <code>maxEle</code> are also returned. <code>maxRad</code> is a legacy field kept for the database and is not used by the path service; <code>maxEle</code> is used as the maximum slope.</li>
              </ul>
            </GlassCard>
          </div>
        </Section>

        <Section
          id="path-parameters"
          eyebrow="GET /path/"
          title="Query parameters"
        >
          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="border-b border-line text-label uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Parameter</th>
                  <th className="px-5 py-3 font-semibold">Required</th>
                  <th className="px-5 py-3 font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-secondary">
                {[
                  ["map", "Yes", "Map ID."],
                  ["startX, startY", "Yes", "Start point in map raster coordinates."],
                  ["endX, endY", "Yes", "Destination point in map raster coordinates."],
                  ["maxSlope", "Yes", "Maximum traversable slope, in degrees."],
                  ["maxTherm, minTherm", "Yes", "Allowed temperature range, in kelvin; minTherm must be lower."],
                  ["maxWind", "Yes", "Maximum wind speed, in metres per second."],
                  ["speed", "Yes", "Rover speed in km/h; must be greater than zero."],
                  ["mode", "No", '"science" enables resource-aware routing; otherwise least-cost routing is used.'],
                  ["step", "No", "Keep every Nth route point in the response; the final point is retained."],
                  ["h2o, fe, si", "No", "Science-mode resource weights; defaults are 0.8, 0.6, and 0.6."],
                ].map(([parameter, required, meaning]) => (
                  <tr key={parameter}>
                    <td className="px-5 py-3 font-mono text-foreground">{parameter}</td>
                    <td className="px-5 py-3">{required}</td>
                    <td className="px-5 py-3">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
          <p className="text-sm leading-6 text-secondary">
            Radiation is not part of the route calculation. The database keeps
            a legacy <code>maxRad</code> column (recorded flights store the
            sentinel <code>9999</code>), but the frontend does not send a
            radiation limit and the backend does not read one. Do not rely on
            it as a safety limit.
          </p>
        </Section>

        <Section
          id="path-response"
          eyebrow="PathData"
          title="Response fields"
        >
          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="border-b border-line text-label uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Field</th>
                  <th className="px-5 py-3 font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-secondary">
                {[
                  ["path_data", "Ordered route waypoints. Each point includes Step, X_coordinate, Y_coordinate, Elevation, Slope_Degrees, therm, H2O, Fe, Si, and Distance_km."],
                  ["route_length_km, route_length_m", "Total route length in kilometres and metres."],
                  ["estimated_time_hours", "Estimated travel time, calculated from route length and speed."],
                  ["maximum_slope, minimum_slope", "Largest and smallest waypoint slopes, in degrees."],
                  ["maximum_therm, minimum_therm", "Largest and smallest waypoint temperatures, in kelvin."],
                  ["maximum_wind_speed", "Maximum wind speed along the route, in m/s; wind is not included per waypoint."],
                  ["mean_Fe, mean_Si, mean_H2O", "Mean resource abundance along the route, in percent."],
                  ["accumulated_cost", "Total cost returned by the route-finding algorithm; unitless."],
                ].map(([field, meaning]) => (
                  <tr key={field}>
                    <td className="px-5 py-3 font-mono text-foreground">{field}</td>
                    <td className="px-5 py-3">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
          <p className="text-sm leading-6 text-secondary">
            Each <code>path_data</code> waypoint has a 1-based{" "}
            <code>Step</code>, <code>X_coordinate</code> and{" "}
            <code>Y_coordinate</code> in raster coordinates,{" "}
            <code>Elevation</code> in the elevation raster&apos;s units,{" "}
            <code>Slope_Degrees</code> in degrees, <code>therm</code> in K,
            <code>H2O</code>/<code>Fe</code>/<code>Si</code> in percent, and{" "}
            <code>Distance_km</code> as cumulative distance from the start.
          </p>
        </Section>

        <Section id="errors" eyebrow="Failures and cancellation" title="Handle API errors">
          <GlassCard className="space-y-4 p-6">
            <p className="text-sm leading-6 text-secondary">
              Requests have a default 60-second timeout. Pass{" "}
              <code>signal</code> to cancel a request or <code>timeoutMs</code>{" "}
              to choose another timeout. Failures are thrown as{" "}
              <code>ApiError</code>, which includes a <code>kind</code> such as{" "}
              <code>network</code>, <code>timeout</code>, <code>aborted</code>,{" "}
              <code>http</code>, or <code>parse</code>; HTTP errors also include
              a <code>status</code> when available.
            </p>
            <CodeExample>{`import { getMap, isApiError } from "@/lib/api";

try {
  const map = await getMap(1, { timeoutMs: 10_000 });
} catch (error) {
  if (isApiError(error)) {
    console.error(error.kind, error.status, error.message);
  }
}`}</CodeExample>
            <p className="text-sm leading-6 text-secondary">
              For routes, <code>getPath</code> validates that coordinates,
              safety limits, and speed are numeric, that speed is positive,
              and that <code>minTherm</code> is below <code>maxTherm</code>.
              The backend can also reject points outside the raster, unsafe
              start/end points, or areas with no traversable route.
            </p>
          </GlassCard>
        </Section>

        <Section
          id="server-example"
          eyebrow="Recommended for data-first pages"
          title="Fetch in a Server Component"
        >
          <GlassCard className="space-y-4 p-6">
            <p className="text-sm leading-6 text-secondary">
              Server Components can call the helpers directly. Requests go to
              the configured API origin from the server, so browser CORS rules
              do not apply.
            </p>
            <CodeExample>{serverExample}</CodeExample>
          </GlassCard>
        </Section>

        <Section
          id="client-example"
          eyebrow="Interactive UI"
          title="Fetch in a Client Component"
        >
          <GlassCard className="space-y-4 p-6">
            <p className="text-sm leading-6 text-secondary">
              For interactive components, call a helper in an effect or event
              handler. Browser calls go directly to the configured API origin,
              so that API must allow this app&apos;s origin through CORS. Pass
              an <code>AbortSignal</code> when the request should stop on
              unmount or when newer inputs replace it.
            </p>
            <CodeExample>{clientExample}</CodeExample>
          </GlassCard>
        </Section>
      </main>
    </>
  );
}
