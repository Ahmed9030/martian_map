import { cn } from "cn";
import { Badge } from "./badge";
import { CardContent, CardHeader, CardTitle } from "./card";
import { GlassCard } from "./GlassCard";
import { Progress } from "./progress";

export type TelemetryCardProps = {
  title: string;
  value: string;
  unit?: string;
  source: string;
  /** Optional normalized indicator value from 0 to 100. */
  progress?: number;
  /** Optional context displayed alongside the value, such as a status or range. */
  detail?: string;
  className?: string;
};

export function TelemetryCard({
  title,
  value,
  unit,
  source,
  progress,
  detail,
  className,
}: TelemetryCardProps) {
  const boundedProgress =
    progress === undefined ? undefined : Math.min(100, Math.max(0, progress));

  return (
    <GlassCard
      label={`${title} telemetry`}
      className={cn("w-full p-0", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-1 px-2 pb-0 pt-1">
        <div>
          <CardTitle className="text-[9px] font-semibold uppercase tracking-[0.08em] text-secondary">
            {title}
          </CardTitle>
          <p className="mt-0.3 flex items-baseline gap-1 text-base font-semibold text-foreground">
            <span className="telemetry-text text-lg">{value}</span>
            {unit && <span className="text-sm font-medium text-secondary">{unit}</span>}
          </p>
        </div>
        {detail && (
          <Badge
            variant="outline"
              className="h-auto max-w-[55px] whitespace-normal text-center leading-tight border-mars/30 bg-mars/10 px-1 py-0.5 text-[8px] font-medium text-mars"
          >
            {detail}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="px-2 pb-1 pt-0">
        {boundedProgress !== undefined && (
          <Progress
            value={boundedProgress}
            aria-label={`${title} indicator`}
            className="mt-0.1 w-full [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:bg-white/10 [&_[data-slot=progress-indicator]]:bg-telemetry"
          />
        )}
        <p className="mt-0.3 border-t border-line pt-0.5 text-[8px] leading-tight text-muted">
          Data source: {source}
        </p>
      </CardContent>
    </GlassCard>
  );
}
