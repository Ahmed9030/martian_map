import { CRS_UNIT_TO_KM } from "./constants";

/** A point in the raster's native CRS units (not longitude/latitude). */
export interface MapPoint {
  x: number;
  y: number;
}

/** Straight-line distance between two CRS points, in kilometres. */
export function straightLineKm(a: MapPoint, b: MapPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y) * CRS_UNIT_TO_KM;
}

/**
 * Picks a `step` value for `GET /path/` so long routes come back simplified.
 * The backend samples the cost grid roughly every 5 km, so a route is sampled
 * ~km/5 times; we aim for at most ~40 waypoints while never dropping detail on
 * short routes.
 */
export function chooseStep(straightKm: number): number {
  if (!Number.isFinite(straightKm) || straightKm <= 0) return 1;
  const estimatedSamples = straightKm / 5;
  return Math.min(15, Math.max(1, Math.round(estimatedSamples / 40)));
}

/** Evenly reduces a series (keeping first and last) to at most `maxPoints`. */
export function downsample<T>(items: readonly T[], maxPoints: number): T[] {
  if (maxPoints < 2 || items.length <= maxPoints) return [...items];
  const lastIndex = items.length - 1;
  const stride = lastIndex / (maxPoints - 1);
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    result.push(items[Math.round(i * stride)]);
  }
  return result;
}

/** Centre of a map's `[[l,t],[r,t],[r,b],[l,b]]` coordinate quad. */
export function mapCenter(coordinates: [number, number][]): MapPoint | null {
  if (coordinates.length < 4) return null;
  const [left, top] = coordinates[0];
  const [right] = coordinates[1];
  const [, bottom] = coordinates[2];
  if (![left, top, right, bottom].every(Number.isFinite)) return null;
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/** Leaflet bounds for the CRS.Simple map, in [lat, lng] pairs. */
export function mapBounds(
  coordinates: [number, number][],
): [[number, number], [number, number]] | null {
  if (coordinates.length < 4) return null;
  const [left, top] = coordinates[0];
  const [right] = coordinates[1];
  const [, bottom] = coordinates[2];
  if (![left, top, right, bottom].every(Number.isFinite)) return null;
  return [
    [bottom, left],
    [top, right],
  ];
}
