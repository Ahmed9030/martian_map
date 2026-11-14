export interface Destination {
  id: number;
  title: string;
  description: string | null;
  photo: string | null;
  x_coord: number;
  y_coord: number;
  map_id: number | null;
}

export interface MapData {
  title: string;
  url: string;
  coordinates: [number, number][];
  destination: Destination[];
}

export interface Vehicle {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  maxSpead: number;
  /** Radiation limit; the API unit is fixture-defined (displayed as-is). */
  maxRad?: number;
  maxEle: number;
  maxTherm: number;
  maxWind: number;
  minTherm: number;
}

export interface NormalizedVehicle extends Omit<Vehicle, "maxSpead"> {
  maxSpeed: number;
}

export type PathMode = "fast" | "science";

export interface PathParams {
  map: number | string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  mode?: PathMode | string;
  maxSlope?: number;
  maxTherm?: number;
  minTherm?: number;
  maxWind?: number;
  speed?: number;
  step?: number;
  h2o?: number;
  fe?: number;
  si?: number;
  token?: string;
  /** Set to "0" to replay a visit without recording a new one. */
  record?: "0" | "1";
}

export interface PathCoordinates {
  x: number;
  y: number;
}

export interface ScienceWeights {
  h2o?: number;
  fe?: number;
  si?: number;
}

export interface BuildPathQueryOptions {
  mapId: number;
  vehicle: Vehicle;
  start: PathCoordinates;
  end: PathCoordinates;
  mode: PathMode;
  maxSlope?: number;
  step?: number;
  weights?: ScienceWeights;
}

export interface PathPoint {
  Step: number;
  X_coordinate: number;
  Y_coordinate: number;
  Elevation: number;
  Slope_Degrees: number;
  /** Legacy single temperature value; `GET /path/` now returns max/min_therm. */
  therm?: number | null;
  /** Day-side temperature for this step, as returned by `GET /path/`. */
  max_therm?: number | null;
  /** Night-side temperature for this step, as returned by `GET /path/`. */
  min_therm?: number | null;
  /** Wind speed at this step, in m/s (added by the backend). */
  Wind?: number | null;
  H2O: number | null;
  Fe: number | null;
  Si: number | null;
  Distance_km: number;
}

export interface PathData {
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
  /** Mean of (day + night) / 2 temperature along the route, in K. */
  mean_therm?: number;
  /** Mean wind speed along the route, in m/s. */
  mean_wind_speed?: number;
}

export type PathResponse = PathData;

export interface CreateProfileResponse {
  token: string;
  name: string;
}

/** A recorded visit, as returned by `GET /flights/` and `GET /revisit/`. */
export interface FlightRecord {
  id: number;
  map_id: number | null;
  map_title: string | null;
  x_start_coord: number;
  y_start_coord: number;
  x_end_coord: number;
  y_end_coord: number;
  maxSpeed: number;
  maxEle: number;
  maxTherm: number;
  maxWind: number;
  minTherm: number;
  mode: string | null;
  created_at: string | null;
  estimated_time: number | null;
  distance_km: number | null;
}

export interface FlightsResponse {
  flights: FlightRecord[];
}
