import type { MapData } from "./api/types";

/**
 * Single source of truth for converting between the Leaflet map space and the
 * raster's native CRS units (metres) used by `GET /map/` and `GET /path/`.
 *
 * The map is rendered with `L.CRS.Simple`, so a Leaflet `latLng` maps directly
 * onto the raster: `lng` is the raster X and `lat` is the raster Y. Destinations,
 * clicks, dragged markers and `path_data` all go through these helpers so they
 * can never drift apart if the projection ever changes.
 */

/** Bounding box of the basemap raster, in CRS units. */
export interface MapBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A point in the Leaflet map space (CRS.Simple lat/lng). */
export interface LngLat {
  lat: number;
  lng: number;
}

/** A point in the raster's native CRS units, as expected by the API. */
export interface CrsPoint {
  x: number;
  y: number;
}

/** Leaflet `[[lat, lng], [lat, lng]]` bounds for `maxBounds` / `imageOverlay`. */
export type LeafletBounds = [[number, number], [number, number]];

function toFinite(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Derives the raster bounds from `GET /map/` coordinates.
 * The API returns four corners as `[[left, top], [right, top], [right, bottom],
 * [left, bottom]]`; min/max keeps this robust to corner order.
 */
export function boundsFromCoordinates(
  coordinates: MapData["coordinates"] | null | undefined,
): MapBounds | null {
  if (!Array.isArray(coordinates) || coordinates.length < 4) return null;

  const xs: number[] = [];
  const ys: number[] = [];

  for (const corner of coordinates) {
    if (!Array.isArray(corner) || corner.length < 2) return null;
    const x = toFinite(corner[0]);
    const y = toFinite(corner[1]);
    if (x === null || y === null) return null;
    xs.push(x);
    ys.push(y);
  }

  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.max(...ys);
  const bottom = Math.min(...ys);

  if (right <= left || top <= bottom) return null;

  return { left, right, top, bottom };
}

/** Map-space point (Leaflet lat/lng) → raster CRS units (x, y). */
export function mapToCrs(lngLat: LngLat, bounds?: MapBounds | null): CrsPoint {
  // `bounds` is part of the contract so every call site passes the /map/
  // bounds; the projection itself is linear for CRS.Simple.
  void bounds;
  // CRS.Simple is a linear, unprojected space: lng → x, lat → y.
  return { x: lngLat.lng, y: lngLat.lat };
}

/** Raster CRS units (x, y) → map-space point (Leaflet lat/lng). */
export function crsToMap(x: number, y: number, bounds?: MapBounds | null): LngLat {
  void bounds;
  return { lat: y, lng: x };
}

/** True when a CRS point lies inside the basemap raster. */
export function isInsideBounds(
  point: CrsPoint,
  bounds: MapBounds,
  margin = 0,
): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  return (
    point.x >= bounds.left + margin &&
    point.x <= bounds.right - margin &&
    point.y >= bounds.bottom + margin &&
    point.y <= bounds.top - margin
  );
}

/** Clamps a CRS point into the raster (used when dragging markers). */
export function clampToBounds(point: CrsPoint, bounds: MapBounds): CrsPoint {
  return {
    x: Math.min(bounds.right, Math.max(bounds.left, point.x)),
    y: Math.min(bounds.bottom, Math.max(bounds.top, point.y)),
  };
}

/** Leaflet `maxBounds` / overlay bounds for the raster. */
export function leafletBounds(bounds: MapBounds): LeafletBounds {
  return [
    [bounds.bottom, bounds.left],
    [bounds.top, bounds.right],
  ];
}

/** Leaflet center of the raster. */
export function leafletCenter(bounds: MapBounds): [number, number] {
  return [(bounds.top + bounds.bottom) / 2, (bounds.left + bounds.right) / 2];
}

/** Human-readable CRS coordinate pair, e.g. `1 204 350, -82 140`. */
export function formatCrsPoint(
  point: CrsPoint | null | undefined,
  digits = 0,
): string {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return "—";
  }
  const format = (value: number) =>
    value
      .toFixed(digits)
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${format(point.x)}, ${format(point.y)}`;
}
