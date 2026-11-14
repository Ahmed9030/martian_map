import type { CrsPoint } from '@/lib/coords';
import { CRS_UNIT_TO_KM } from '@/lib/path/constants';
import { getRiskLevel } from '@/lib/path/risk';
import type { PathData, PathPoint, Vehicle } from '@/lib/api';
import type { TourDemoResult } from './types';

/** The API has no per-vehicle slope limit; 15° is the documented default. */
export const TOUR_MAX_SLOPE = 15;

/** Used only when `GET /vehicles/` cannot be reached. */
export const TOUR_FALLBACK_LIMITS: {
  speed: number;
  maxTherm: number;
  minTherm: number;
  maxWind: number;
} = {
  speed: 20,
  maxTherm: 300,
  minTherm: 150,
  maxWind: 25,
};

const SAMPLE_POINTS = 36;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Mirrors the map's vehicle guard so the demo never sends invalid limits. */
export function isUsableVehicle(vehicle: Vehicle): boolean {
  return (
    isFiniteNumber(vehicle.maxSpead) &&
    vehicle.maxSpead > 0 &&
    isFiniteNumber(vehicle.minTherm) &&
    isFiniteNumber(vehicle.maxTherm) &&
    vehicle.minTherm < vehicle.maxTherm
  );
}

/** Condenses a `/path/` response into the numbers the tooltip shows. */
export function summarizePath(path: PathData): TourDemoResult {
  const maxSlope = Number(path.maximum_slope);
  return {
    distanceKm: Number(path.route_length_km),
    hours: Number(path.estimated_time_hours),
    maxSlope: Number.isFinite(maxSlope) ? maxSlope : 0,
    risk: getRiskLevel(maxSlope, TOUR_MAX_SLOPE),
    minTherm: Number(path.minimum_therm),
    maxTherm: Number(path.maximum_therm),
  };
}

/**
 * Deterministic stand-in for `GET /path/` so the tour still demonstrates the
 * charts when the API is unreachable. It is labelled "Sample data" in the UI.
 */
export function createSamplePath(start: CrsPoint, end: CrsPoint): PathData {
  const points: PathPoint[] = [];
  let distanceKm = 0;
  let previous: PathPoint | null = null;

  for (let index = 0; index < SAMPLE_POINTS; index += 1) {
    const t = index / (SAMPLE_POINTS - 1);
    const bend = Math.sin(t * Math.PI) * 0.08;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t + (start.y - end.y) * bend;
    const elevation = 420 + Math.sin(t * Math.PI * 3) * 180 + t * 240;
    const slope = Math.max(0, Math.sin(t * Math.PI * 4 + 0.6) * 9 + 6);
    const maxTherm = 232 + Math.sin(t * Math.PI * 2) * 14;
    const minTherm = 168 + Math.cos(t * Math.PI * 2) * 10;

    const point: PathPoint = {
      Step: index + 1,
      X_coordinate: x,
      Y_coordinate: y,
      Elevation: Number(elevation.toFixed(1)),
      Slope_Degrees: Number(slope.toFixed(1)),
      max_therm: Number(maxTherm.toFixed(1)),
      min_therm: Number(minTherm.toFixed(1)),
      Wind: Number((8 + Math.sin(t * Math.PI * 3) * 3).toFixed(1)),
      H2O: Number((42 + Math.sin(t * Math.PI * 2) * 8).toFixed(1)),
      Fe: Number((18 + Math.cos(t * Math.PI * 3) * 5).toFixed(1)),
      Si: Number((55 + Math.sin(t * Math.PI * 1.5) * 6).toFixed(1)),
      Distance_km: 0,
    };

    if (previous) {
      distanceKm += Math.hypot(
        point.X_coordinate - previous.X_coordinate,
        point.Y_coordinate - previous.Y_coordinate,
      ) * CRS_UNIT_TO_KM;
    }
    point.Distance_km = Number(distanceKm.toFixed(3));
    previous = point;
    points.push(point);
  }

  const slopes = points.map((point) => point.Slope_Degrees ?? 0);
  const maxThermValues = points.map((point) => point.max_therm ?? 0);
  const minThermValues = points.map((point) => point.min_therm ?? 0);
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

  return {
    path_data: points,
    route_length_km: Number(distanceKm.toFixed(2)),
    route_length_m: Number((distanceKm * 1000).toFixed(0)),
    estimated_time_hours: Number((distanceKm / TOUR_FALLBACK_LIMITS.speed).toFixed(2)),
    maximum_slope: Math.max(...slopes),
    minimum_slope: Math.min(...slopes),
    maximum_therm: Math.max(...maxThermValues),
    minimum_therm: Math.min(...minThermValues),
    maximum_wind_speed: 11,
    accumulated_cost: 0,
    mean_Fe: Number(mean(points.map((point) => point.Fe ?? 0)).toFixed(1)),
    mean_Si: Number(mean(points.map((point) => point.Si ?? 0)).toFixed(1)),
    mean_H2O: Number(mean(points.map((point) => point.H2O ?? 0)).toFixed(1)),
    mean_therm: Number(mean(maxThermValues.map((value, i) => (value + minThermValues[i]) / 2)).toFixed(1)),
    mean_wind_speed: 8.4,
  };
}
