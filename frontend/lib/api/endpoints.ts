import { apiGet } from "./client";
import { ApiError } from "./errors";
import type { ApiRequestOptions } from "./client";
import type { MapData, PathData, PathParams, Vehicle } from "./types";

export async function getMap(
  mapId: number | string,
  options: ApiRequestOptions = {},
): Promise<MapData> {
  return apiGet<MapData>("/map/", { map: mapId }, options);
}

export async function getVehicles(
  options: ApiRequestOptions = {},
): Promise<Vehicle[]> {
  return apiGet<Vehicle[]>("/vehicles/", {}, options);
}

export function validatePathParams(params: PathParams): void {
  const required: Array<keyof PathParams> = [
    "map",
    "startX",
    "startY",
    "endX",
    "endY",
    "maxSlope",
    "maxTherm",
    "minTherm",
    "maxWind",
    "speed",
  ];

  for (const key of required) {
    const value = params[key];
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      throw new ApiError({
        kind: "http",
        status: 400,
        message: `Missing or invalid path parameter: ${String(key)}.`,
      });
    }
  }

  const speed = Number(params.speed);
  const minTherm = Number(params.minTherm);
  const maxTherm = Number(params.maxTherm);

  if (!Number.isFinite(speed) || speed <= 0) {
    throw new ApiError({
      kind: "http",
      status: 400,
      message: "Path validation failed: speed must be a number greater than 0.",
    });
  }

  if (!Number.isFinite(minTherm) || !Number.isFinite(maxTherm) || minTherm >= maxTherm) {
    throw new ApiError({
      kind: "http",
      status: 400,
      message: "Path validation failed: minTherm must be less than maxTherm.",
    });
  }
}

export async function getPath(
  params: PathParams,
  options: ApiRequestOptions = {},
): Promise<PathData> {
  validatePathParams(params);

  const queryParams: Record<string, string | number | boolean | undefined | null> = {
    map: params.map,
    startX: params.startX,
    startY: params.startY,
    endX: params.endX,
    endY: params.endY,
    maxSlope: params.maxSlope,
    maxTherm: params.maxTherm,
    minTherm: params.minTherm,
    maxWind: params.maxWind,
    speed: params.speed,
    mode: params.mode,
    step: params.step,
    h2o: params.h2o,
    fe: params.fe,
    si: params.si,
    maxRadiation: params.maxRadiation,
  };

  // TODO: The backend README shows maxRadiation in examples, but the params table omits it; keep the runtime support while documenting the inconsistency.
  return apiGet<PathData>("/path/", queryParams, options);
}
