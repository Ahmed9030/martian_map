import { Atom, Info } from "lucide-react";
import { cn } from "cn";
import { GlassCard } from "./GlassCard";
import { CardContent, CardHeader, CardTitle } from "./card";

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;
const DEFAULT_SOURCE = "MRO (CRISM)";

/** A mineral percentage may be absent while a route is loading or unavailable. */
export type MineralValue = number | null | undefined;

interface MineralDefinition {
  key: keyof MineralValues;
  label: string;
  formula: string;
  barClassName: string;
}

interface MineralValues {
  h2o: MineralValue;
  si: MineralValue;
  fe: MineralValue;
}

export const MINERALS: readonly MineralDefinition[] = [
  { key: "h2o", label: "Water", formula: "H₂O", barClassName: "bg-telemetry" },
  { key: "si", label: "Silicon", formula: "Si", barClassName: "bg-emerald-400" },
  { key: "fe", label: "Iron", formula: "Fe", barClassName: "bg-mars" },
];

export type MineralCompositionProps = MineralValues & {
  /** Label shown in the footer; defaults to the CRISM spectrometer. */
  source?: string;
  isLoading?: boolean;
  className?: string;
};

/** Clamps a percentage to 0–100, or returns null when unusable. */
function normalizePercent(value: MineralValue): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
}

function MineralRow({
  mineral,
  value,
}: {
  mineral: MineralDefinition;
  value: number;
}) {
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label text-secondary">
          {mineral.label} ({mineral.formula})
        </span>
        <span className="text-label font-semibold tabular-nums text-foreground">
          {value}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={MIN_PERCENT}
        aria-valuemax={MAX_PERCENT}
        aria-label={`${mineral.label} (${mineral.formula}) composition`}
        className="h-1 w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            mineral.barClassName,
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </li>
  );
}

function MineralSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {MINERALS.map((mineral) => (
        <li key={mineral.key} className="animate-pulse space-y-1">
          <div className="flex justify-between gap-2">
            <span className="h-2 w-20 rounded bg-white/10" />
            <span className="h-2 w-6 rounded bg-white/10" />
          </div>
          <div className="h-1 w-full rounded-full bg-white/10" />
        </li>
      ))}
    </ul>
  );
}

export function MineralComposition({
  h2o,
  si,
  fe,
  source = DEFAULT_SOURCE,
  isLoading = false,
  className,
}: MineralCompositionProps) {
  const values: Record<keyof MineralValues, number | null> = {
    h2o: normalizePercent(h2o),
    si: normalizePercent(si),
    fe: normalizePercent(fe),
  };
  const hasData = MINERALS.every((mineral) => values[mineral.key] !== null);

  return (
    <GlassCard
      label="Mineral composition"
      aria-busy={isLoading}
      className={cn("w-60 p-0", className)}
    >
      <CardHeader className="flex flex-row items-center gap-1.5 px-3 pb-0 pt-2.5">
        <Atom size={14} className="text-telemetry" aria-hidden="true" />
        <CardTitle className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
          Mineral Composition
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-2">
        {isLoading ? (
          <MineralSkeleton />
        ) : hasData ? (
          <ul className="space-y-2">
            {MINERALS.map((mineral) => (
              <MineralRow
                key={mineral.key}
                mineral={mineral}
                value={values[mineral.key] ?? MIN_PERCENT}
              />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-center text-[10px] leading-tight text-muted">
            No mineral data available for this route.
          </p>
        )}
        <p className="mt-2 flex items-center gap-1 border-t border-line pt-1.5 text-[8px] leading-tight text-muted">
          <Info size={9} aria-hidden="true" />
          Data source: {source}
        </p>
      </CardContent>
    </GlassCard>
  );
}
