/** A waypoint returned by the path endpoint. Measurements may be null when unavailable. */
export interface PathPoint {
  Step: number;
  X_coordinate: number;
  Y_coordinate: number;
  Elevation: number;
  Slope_Degrees: number | null;
  therm?: number | null;
  max_therm?: number | null;
  min_therm?: number | null;
  Wind?: number | null;
  H2O: number | null;
  Fe: number | null;
  Si: number | null;
  Distance_km: number;
}

/** The response shape consumed by the path data helpers. */
export interface PathResponse {
  path_data: PathPoint[];
  route_length_km: number;
  route_length_m: number;
  estimated_time_hours: number;
  maximum_slope: number;
  minimum_slope: number;
  maximum_therm: number;
  minimum_therm: number;
  maximum_wind_speed: number;
  accumulated_cost: number;
  mean_Fe: number;
  mean_Si: number;
  mean_H2O: number;
}

/** Relative terrain risk category. */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Mean mineral percentages along a path. */
export interface MineralAverages {
  fe: number;
  si: number;
  h2o: number;
}
