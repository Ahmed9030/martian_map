"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Clock3,
  Loader2,
  LogIn,
  MapPin,
  RefreshCw,
  Rocket,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { createProfile, getFlights, getPath, getRevisitFlight } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { FlightRecord, PathData } from "@/lib/api";
import {
  clearProfile,
  getProfileSnapshot,
  getServerProfileSnapshot,
  setProfileName,
  setProfileToken,
  shortToken,
  subscribeProfile,
} from "@/lib/profile/storage";
import { VisitDetail } from "./VisitDetail";

type Tab = "visits" | "create";

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(digits).replace(/\.0+$/, "");
}

export function ProfileClient() {
  const { token, name } = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeProfile,
    () => true,
    () => false,
  );
  const [tab, setTab] = useState<Tab | null>(null);
  const activeTab: Tab = tab ?? (token ? "visits" : "create");

  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [flightsStatus, setFlightsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [flightsError, setFlightsError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selected, setSelected] = useState<FlightRecord | null>(null);
  const [path, setPath] = useState<PathData | null>(null);
  const [replayStatus, setReplayStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [replayError, setReplayError] = useState<string | null>(null);
  const replayIdRef = useRef(0);

  const loadFlights = useCallback(async (profileToken: string) => {
    try {
      const response = await getFlights(profileToken);
      setFlights(response.flights);
      setFlightsStatus("success");
    } catch (error) {
      setFlightsStatus("error");
      setFlightsError(friendlyError(error));
    }
  }, []);

  // Load the visits whenever the stored profile changes (including first paint).
  useEffect(() => {
    // State updates happen after the request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) void loadFlights(token);
  }, [token, loadFlights]);

  // A profile with no resolved result yet is still loading its visits.
  const visibleFlightsStatus =
    flightsStatus === "idle" && token ? "loading" : flightsStatus;

  const replay = useCallback(
    async (flight: FlightRecord, profileToken: string | null) => {
      replayIdRef.current += 1;
      const requestId = replayIdRef.current;
      setReplayStatus("loading");
      setReplayError(null);
      setPath(null);

      try {
        const stored = await getRevisitFlight(flight.id);
        if (replayIdRef.current !== requestId) return;

        const data = await getPath(
          {
            map: stored.map_id ?? flight.map_id ?? 1,
            startX: stored.x_start_coord,
            startY: stored.y_start_coord,
            endX: stored.x_end_coord,
            endY: stored.y_end_coord,
            maxSlope: stored.maxEle,
            maxTherm: stored.maxTherm,
            minTherm: stored.minTherm,
            maxWind: stored.maxWind,
            speed: stored.maxSpeed,
            mode: stored.mode ?? "fast",
            token: profileToken ?? undefined,
            record: "0",
          },
          {},
        );

        if (replayIdRef.current !== requestId) return;
        setPath(data);
        setReplayStatus("success");
      } catch (error) {
        if (replayIdRef.current !== requestId) return;
        setReplayStatus("error");
        setReplayError(friendlyError(error));
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (flight: FlightRecord) => {
      setSelected(flight);
      void replay(flight, token);
    },
    [replay, token],
  );

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (creating) return;

      setCreating(true);
      setCreateError(null);
      try {
        const response = await createProfile(formName);
        setProfileToken(response.token);
        setProfileName(response.name);
        setFormName("");
        setTab("visits");
        setFlightsError(null);
        setFlightsStatus("loading");
        setSelected(null);
        setPath(null);
        // The token change triggers the visits effect above.
      } catch (error) {
        setCreateError(friendlyError(error));
      } finally {
        setCreating(false);
      }
    },
    [creating, formName],
  );

  const handleReset = useCallback(() => {
    clearProfile();
    setFlights([]);
    setFlightsStatus("idle");
    setSelected(null);
    setPath(null);
    setReplayStatus("idle");
    setTab(null);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-home text-home-cream">
      <div className="hero-sky absolute inset-0 -z-20" aria-hidden="true" />
      <div className="hero-stars absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 top-10 -z-10 size-[520px] rounded-full bg-home-glow/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-6 pb-20 pt-32 md:px-10 md:pt-36">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-home-sand">
              Mission log
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[0.08em] text-home-cream">
              ASTRONAUT <span className="text-home-coral">PROFILE</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-home-body">
              Create a profile, then every route you plan on the map is recorded
              here with its distance, limits and full terrain replay.
            </p>
          </div>

          {token ? (
            <GlassCard className="w-full max-w-xs gap-0 p-5 md:w-72">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-home-muted">
                <UserRound size={12} className="text-home-glow" />
                Active profile
              </p>
              <p className="mt-2 truncate font-display text-lg font-semibold text-home-cream">
                {name ?? "Astronaut"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-home-muted">
                {shortToken(token)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    setFlightsError(null);
                    setFlightsStatus("loading");
                    if (token) void loadFlights(token);
                  }}
                  className="text-[10px] uppercase tracking-[0.14em]"
                >
                  <RefreshCw size={12} />
                  Refresh
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="text-[10px] uppercase tracking-[0.14em]"
                >
                  New profile
                </Button>
              </div>
            </GlassCard>
          ) : null}
        </header>

        <nav
          aria-label="Profile sections"
          className="glass-panel mt-10 flex w-fit gap-1 rounded-full p-1"
        >
          <button
            type="button"
            onClick={() => setTab("visits")}
            aria-current={activeTab === "visits" ? "page" : undefined}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "visits"
                ? "bg-home-cream text-home-ink"
                : "text-home-body hover:bg-white/5 hover:text-home-cream"
            }`}
          >
            <Route size={13} />
            My visits
            {visibleFlightsStatus === "success" ? (
              <span className="rounded-full bg-home-coral/20 px-1.5 text-[9px] text-home-coral">
                {flights.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            aria-current={activeTab === "create" ? "page" : undefined}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "create"
                ? "bg-home-cream text-home-ink"
                : "text-home-body hover:bg-white/5 hover:text-home-cream"
            }`}
          >
            <Sparkles size={13} />
            Create profile
          </button>
        </nav>

        <div className="mt-8">
          {!hydrated ? (
            <GlassCard className="items-center p-10">
              <Loader2 className="animate-spin text-home-glow" size={22} />
            </GlassCard>
          ) : activeTab === "create" ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <GlassCard className="gap-5 p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-home-glow">
                    Step 1 · Identity
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-home-cream">
                    Become a Martian
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-home-body">
                    Your token is stored in this browser only. Keep it to find
                    your visits again — there is no password.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-home-muted">
                      Astronaut name
                    </span>
                    <input
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      maxLength={255}
                      required
                      autoComplete="name"
                      placeholder="e.g. A. Gomaa"
                      className="mt-2 w-full rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm text-home-cream placeholder:text-home-muted/60 focus:border-home-ember/70 focus:outline-none"
                    />
                  </label>

                  {createError ? (
                    <p className="flex items-start gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-xs text-red-200">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      {createError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    variant="accent"
                    disabled={creating || !formName.trim()}
                    className="min-h-12 gap-2 px-6 text-xs uppercase tracking-[0.16em]"
                  >
                    {creating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <LogIn size={14} />
                    )}
                    {token ? "Create new identity" : "Create profile"}
                  </Button>
                </form>
              </GlassCard>

              <GlassCard className="gap-4 p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-home-muted">
                  How visits work
                </p>
                <ol className="space-y-4 text-sm leading-6 text-home-body">
                  {[
                    "Create your profile to receive a private token.",
                    "Plan any route on the map — it is logged automatically.",
                    "Open a visit here to replay its terrain, temperature and wind.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-home-ember/40 bg-home-ember/10 font-mono text-[10px] text-home-ember">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[10px] leading-5 text-home-muted">
                  Visits are recorded by the API on <span className="text-home-cream">/path/</span>{" "}
                  when the request carries your token.
                </p>
              </GlassCard>
            </div>
          ) : !token ? (
            <GlassCard className="items-center gap-3 p-12 text-center">
              <Rocket className="text-home-glow" size={28} />
              <h2 className="font-display text-xl font-semibold text-home-cream">
                No profile on this browser
              </h2>
              <p className="max-w-md text-sm leading-6 text-home-body">
                Create a profile to start recording your Martian routes.
              </p>
              <Button variant="accent" onClick={() => setTab("create")} className="mt-2">
                Create profile
              </Button>
            </GlassCard>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
              <section aria-label="Visits" className="space-y-3">
                {visibleFlightsStatus === "loading" ? (
                  <GlassCard className="items-center gap-3 p-10 text-center">
                    <Loader2 className="animate-spin text-home-glow" size={20} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-home-muted">
                      Loading visits…
                    </p>
                  </GlassCard>
                ) : visibleFlightsStatus === "error" ? (
                  <GlassCard className="items-start gap-3 p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-home-ember">
                      Could not load visits
                    </p>
                    <p className="text-sm text-home-body">{flightsError}</p>
                    <Button
                      variant="quiet"
                      onClick={() => {
                        if (!token) return;
                        setFlightsError(null);
                        setFlightsStatus("loading");
                        void loadFlights(token);
                      }}
                      className="mt-1"
                    >
                      Retry
                    </Button>
                  </GlassCard>
                ) : flights.length === 0 ? (
                  <GlassCard className="items-center gap-3 p-10 text-center">
                    <MapPin className="text-home-glow" size={24} />
                    <h3 className="font-display text-lg font-semibold text-home-cream">
                      No visits yet
                    </h3>
                    <p className="text-sm leading-6 text-home-body">
                      Pick a start and an end on the map and your first route will
                      appear here.
                    </p>
                    <Button href="/map" variant="accent" className="mt-1">
                      Open the map
                    </Button>
                  </GlassCard>
                ) : (
                  <ul className="space-y-3">
                    {flights.map((flight) => {
                      const active = selected?.id === flight.id;
                      return (
                        <li key={flight.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(flight)}
                            aria-current={active ? "true" : undefined}
                            className={`w-full rounded-[var(--radius-card)] border p-5 text-left transition-all duration-200 ${
                              active
                                ? "border-home-ember/60 bg-home-ember/10 shadow-[0_18px_50px_rgb(0_0_0_/_35%)]"
                                : "border-white/10 bg-white/[0.03] hover:border-home-ember/35 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-home-muted">
                                  Visit #{flight.id}
                                </p>
                                <p className="mt-1 truncate font-display text-base font-semibold text-home-cream">
                                  {flight.map_title ?? `Map ${flight.map_id ?? "—"}`}
                                </p>
                              </div>
                              <ChevronRight
                                size={16}
                                className={active ? "text-home-ember" : "text-home-muted"}
                              />
                            </div>
                            <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-home-muted">
                              <div>
                                <dt className="uppercase tracking-[0.14em]">Distance</dt>
                                <dd className="mt-0.5 font-mono text-xs text-home-cream">
                                  {formatNumber(flight.distance_km, 2)} km
                                </dd>
                              </div>
                              <div>
                                <dt className="uppercase tracking-[0.14em]">Time</dt>
                                <dd className="mt-0.5 font-mono text-xs text-home-cream">
                                  {formatNumber(flight.estimated_time, 2)} h
                                </dd>
                              </div>
                              <div>
                                <dt className="uppercase tracking-[0.14em]">Mode</dt>
                                <dd className="mt-0.5 font-mono text-xs text-home-cream">
                                  {flight.mode === "science" ? "science" : "least-cost"}
                                </dd>
                              </div>
                            </dl>
                            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-home-muted">
                              <CalendarClock size={11} />
                              {formatDate(flight.created_at)}
                              <Clock3 size={11} className="ml-2" />
                              speed {formatNumber(flight.maxSpeed, 1)} km/h
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section aria-label="Visit details">
                {selected ? (
                  <VisitDetail
                    flight={selected}
                    path={path}
                    isLoading={replayStatus === "loading"}
                    error={replayError}
                    onRetry={() => void replay(selected, token)}
                  />
                ) : (
                  <GlassCard className="h-full min-h-[320px] items-center justify-center gap-3 p-10 text-center">
                    <Route className="text-home-glow" size={26} />
                    <h2 className="font-display text-xl font-semibold text-home-cream">
                      Select a visit
                    </h2>
                    <p className="max-w-sm text-sm leading-6 text-home-body">
                      Choose a recorded route to replay its terrain profile,
                      temperature, wind and mineral abundance.
                    </p>
                  </GlassCard>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
