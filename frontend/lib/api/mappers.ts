import type { NormalizedVehicle, PathParams, Vehicle } from "./types";

export function normalizeVehicle(vehicle: Vehicle): NormalizedVehicle {
  return {
    ...vehicle,
    maxSpeed: vehicle.maxSpead,
  };
}

export function vehicleToPathParams(
  vehicle: Vehicle | NormalizedVehicle,
): Pick<
  PathParams,
  "speed" | "maxTherm" | "minTherm" | "maxWind" | "maxRadiation" | "maxSlope"
> {
  return {
    speed: "maxSpeed" in vehicle ? vehicle.maxSpeed : vehicle.maxSpead,
    maxTherm: vehicle.maxTherm,
    maxWind: vehicle.maxWind,
    maxRadiation: vehicle.maxRad,
    minTherm: vehicle.minTherm,
    maxSlope: vehicle.maxEle,
  };
}
