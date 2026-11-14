const DASH = "—";

function isUsable(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Fixed-decimal number with a dash fallback. */
export function formatNumber(
  value: number | null | undefined,
  digits = 1,
): string {
  return isUsable(value) ? value.toFixed(digits) : DASH;
}

/** Distance in km with adaptive precision (metres for short routes). */
export function formatDistanceKm(value: number | null | undefined): string {
  if (!isUsable(value)) return DASH;
  if (value < 1) return `${(value * 1000).toFixed(0)} m`;
  if (value < 10) return `${value.toFixed(2)} km`;
  return `${value.toFixed(1)} km`;
}

/** Duration in hours, switching to days for very long routes. */
export function formatHours(value: number | null | undefined): string {
  if (!isUsable(value)) return DASH;
  if (value >= 72) return `${(value / 24).toFixed(1)} days`;
  if (value >= 10) return `${value.toFixed(1)} h`;
  return `${value.toFixed(2)} h`;
}

/** Clamps a value to a range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
