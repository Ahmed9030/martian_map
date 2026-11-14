"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Clock3,
  Droplets,
  Gauge,
  Mountain,
  Route,
  Thermometer,
  Wind,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { getOverallPathRisk } from "@/lib/path/risk";
import type { FlightRecord, PathData } from "@/lib/api";

type VisitDetailProps = {
  flight: FlightRecord;
  path: PathData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

const RISK_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const RISK_CLASS: Record<string, string> = {
  low: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-home-gold border-home-gold/30 bg-home-gold/10",
  high: "text-home-ember border-home-ember/30 bg-home-ember/10",
  critical: "text-red-300 border-red-400/30 bg-red-400/10",
};

function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(digits).replace(/\.0+$/, "");
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

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-home-muted">
        <span className="text-home-glow">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 font-mono text-lg text-home-cream">
        {value}
        {unit ? <span className="ml-1 text-xs text-home-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassCard className="gap-0 p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-home-muted">
        {title}
      </p>
      <div className="h-40 w-full">{children}</div>
    </GlassCard>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-[10px] text-home-cream">
      <p className="mb-1 font-mono text-home-muted">{label} km</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 font-mono">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {formatNumber(entry.value, 1)}
          {suffix ?? ""}
        </p>
      ))}
    </div>
  );
}

export function VisitDetail({
  flight,
  path,
  isLoading,
  error,
  onRetry,
}: VisitDetailProps) {
  const risk = path
    ? getOverallPathRisk(path.path_data, flight.maxEle)
    : null;

  const chartData =
    path?.path_data.map((point) => ({
      km: Number(point.Distance_km.toFixed(2)),
      elevation: point.Elevation,
      slope: point.Slope_Degrees,
      day: point.max_therm,
      night: point.min_therm,
      wind: point.Wind ?? null,
    })) ?? [];

  return (
    <div className="space-y-4">
      <GlassCard className="gap-0 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-home-glow">
              Visit #{flight.id} · {formatDate(flight.created_at)}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-home-cream">
              {flight.map_title ?? `Map ${flight.map_id ?? "—"}`}
            </h2>
            <p className="mt-2 font-mono text-[11px] text-home-muted">
              ({formatNumber(flight.x_start_coord, 0)},{" "}
              {formatNumber(flight.y_start_coord, 0)}) → (
              {formatNumber(flight.x_end_coord, 0)},{" "}
              {formatNumber(flight.y_end_coord, 0)})
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-home-body">
              {flight.mode === "science" ? "Science route" : "Least-cost route"}
            </span>
            {risk ? (
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${RISK_CLASS[risk]}`}
              >
                Slope risk · {RISK_LABEL[risk]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            icon={<Route size={12} />}
            label="Distance"
            value={formatNumber(path?.route_length_km ?? flight.distance_km, 2)}
            unit="km"
          />
          <Stat
            icon={<Clock3 size={12} />}
            label="Est. time"
            value={formatNumber(path?.estimated_time_hours ?? flight.estimated_time, 2)}
            unit="h"
          />
          <Stat
            icon={<Mountain size={12} />}
            label="Max slope"
            value={formatNumber(path?.maximum_slope ?? flight.maxEle, 1)}
            unit="°"
          />
          <Stat
            icon={<Gauge size={12} />}
            label="Speed"
            value={formatNumber(flight.maxSpeed, 1)}
            unit="km/h"
          />
        </div>

        {path ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              icon={<Thermometer size={12} />}
              label="Mean temp"
              value={formatNumber(path.mean_therm)}
              unit="K"
            />
            <Stat
              icon={<Wind size={12} />}
              label="Mean wind"
              value={formatNumber(path.mean_wind_speed)}
              unit="m/s"
            />
            <Stat
              icon={<Droplets size={12} />}
              label="Water"
              value={formatNumber(path.mean_H2O, 1)}
              unit="%"
            />
            <Stat
              icon={<Gauge size={12} />}
              label="Cost"
              value={formatNumber(path.accumulated_cost, 0)}
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            href={`/map?flight=${flight.id}`}
            variant="accent"
            className="min-h-10 gap-2 px-5 text-[11px] uppercase tracking-[0.16em]"
          >
            Open route on map
            <ArrowUpRight size={14} />
          </Button>
          {flight.map_id ? (
            <Button
              href={`/map?map=${flight.map_id}`}
              variant="quiet"
              className="min-h-10 px-5 text-[11px] uppercase tracking-[0.16em]"
            >
              Open map region
            </Button>
          ) : null}
        </div>
      </GlassCard>

      {isLoading ? (
        <GlassCard className="items-center justify-center p-10 text-center">
          <p className="animate-pulse font-mono text-xs uppercase tracking-[0.2em] text-home-glow">
            Replaying stored route…
          </p>
        </GlassCard>
      ) : error ? (
        <GlassCard className="items-start gap-3 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-home-ember">
            Replay failed
          </p>
          <p className="text-sm text-home-body">{error}</p>
          <Button variant="quiet" onClick={onRetry} className="mt-1">
            Try again
          </Button>
        </GlassCard>
      ) : path ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Terrain profile · elevation (m) & slope (°)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67d8f2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#67d8f2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="km"
                  tick={{ fill: "#8a8ea3", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#8a8ea3", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  name="Elevation"
                  stroke="#67d8f2"
                  fill="url(#elevationFill)"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="slope"
                  name="Slope"
                  stroke="#e8743b"
                  dot={false}
                  strokeWidth={1.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Temperature (K) & wind (m/s)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="km"
                  tick={{ fill: "#8a8ea3", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#8a8ea3", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="day"
                  name="Day temp"
                  stroke="#ffbd91"
                  dot={false}
                  strokeWidth={1.4}
                />
                <Line
                  type="monotone"
                  dataKey="night"
                  name="Night temp"
                  stroke="#b44ce6"
                  dot={false}
                  strokeWidth={1.2}
                />
                <Line
                  type="monotone"
                  dataKey="wind"
                  name="Wind"
                  stroke="#67d8f2"
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <GlassCard className="gap-3 p-5 lg:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-home-muted">
              Mineral abundance along the route
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Water (H₂O)", value: path.mean_H2O, color: "bg-telemetry" },
                { label: "Silicon (Si)", value: path.mean_Si, color: "bg-emerald-400" },
                { label: "Iron (Fe)", value: path.mean_Fe, color: "bg-mars" },
              ].map((mineral) => {
                const percent = Math.min(100, Math.max(0, Math.round(mineral.value)));
                return (
                  <div key={mineral.label}>
                    <div className="flex justify-between text-[11px] text-home-body">
                      <span>{mineral.label}</span>
                      <span className="font-mono">{formatNumber(mineral.value, 1)}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${mineral.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      ) : (
        <GlassCard className="p-6">
          <p className="text-sm text-home-body">No route data available for this visit.</p>
        </GlassCard>
      )}

      <p className="px-1 text-[10px] text-home-muted">
        Recorded limits — slope ≤ {formatNumber(flight.maxEle, 0)}° · temperature{" "}
        {formatNumber(flight.minTherm, 0)}–{formatNumber(flight.maxTherm, 0)} K · wind ≤{" "}
        {formatNumber(flight.maxWind, 0)} m/s
      </p>
    </div>
  );
}
