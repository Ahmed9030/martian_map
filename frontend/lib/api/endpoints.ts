import { apiGet, apiPost } from "./client";
import { ApiError } from "./errors";
import { getProfileToken } from "@/lib/profile/storage";
import type { ApiRequestOptions } from "./client";
import type {
  CreateProfileResponse,
  FlightRecord,
  FlightsResponse,
  MapData,
  PathData,
  PathParams,
  Vehicle,
} from "./types";

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

  // The backend records the visit when a valid profile token is present.
  // `record: "0"` replays a stored visit without logging a duplicate.
  const token = params.token ?? getProfileToken() ?? undefined;

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
    token,
    record: params.record,
  };

  return apiGet<PathData>("/path/", queryParams, options);
}

/**
 * Click-to-route entry point used by the map picker. Same transport as
 * `getPath` (URLSearchParams query on `GET /path/`, with HTML/500 responses
 * and non-JSON bodies normalised into `ApiError`), named explicitly for the
 * picking flow.
 */
export async function getRoute(
  params: PathParams,
  options: ApiRequestOptions = {},
): Promise<PathData> {
  return getPath(params, options);
}

/** Creates a new astronaut profile and returns its token. */
export async function createProfile(
  name: string,
  options: ApiRequestOptions = {},
): Promise<CreateProfileResponse> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ApiError({
      kind: "http",
      status: 400,
      message: "Enter a name for your profile.",
    });
  }
  return apiPost<CreateProfileResponse>("/createastro/", { name: trimmed }, options);
}

/** Lists the visits recorded for a profile, newest first. */
export async function getFlights(
  token: string,
  options: ApiRequestOptions = {},
): Promise<FlightsResponse> {
  return apiGet<FlightsResponse>("/flights/", { token }, options);
}

/** Loads a stored visit's parameters for replay. */
export async function getRevisitFlight(
  flightId: number | string,
  options: ApiRequestOptions = {},
): Promise<FlightRecord> {
  return apiGet<FlightRecord>("/revisit/", { id: flightId, format: "json" }, options);
}
