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
  maxRad: number;
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
  maxRadiation?: number;
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
  therm: number;
  /** Day-side temperature for this step, as returned by `GET /path/`. */
  max_therm: number;
  /** Night-side temperature for this step, as returned by `GET /path/`. */
  min_therm: number;
  H2O: number;
  Fe: number;
  Si: number;
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
}

export type PathResponse = PathData;
