import type { ComponentProps } from "react";
import { cn } from "cn";
import { Card } from "./card";

export type GlassCardProps = ComponentProps<typeof Card> & {
  /** Accessible name for the card when it contains a distinct content region. */
  label?: string;
};

export function GlassCard({
  label,
  className,
  role,
  ...props
}: GlassCardProps) {
  return (
    <Card
      role={role ?? (label ? "region" : undefined)}
      aria-label={label}
      className={cn(
        "glass-card transition-colors duration-200 hover:border-mars/40 focus-within:border-telemetry/70",
        className,
      )}
      {...props}
    />
  );
}
