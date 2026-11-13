import { API_BASE_URL } from "./config";
import { ApiError, getFriendlyApiMessage } from "./errors";
import { vehicleToPathParams } from "./mappers";
import type { BuildPathQueryOptions, PathData } from "./types";

export const DEFAULT_MAX_SLOPE = 15;
export const DEFAULT_SCIENCE_WEIGHTS = {
  h2o: 0.8,
  fe: 0.6,
  si: 0.6,
} as const;

function assertFiniteNumber(name: string, value: number | undefined): asserts value is number {
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`Path query requires ${name} to be a finite number.`);
  }
}

function addNumber(
  query: URLSearchParams,
  name: string,
  value: number | undefined,
): void {
  assertFiniteNumber(name, value);
  query.set(name, String(value));
}

/**
 * Builds a shareable API URL from a vehicle and route inputs.
 * Example: buildPathQuery({ mapId: 1, vehicle, start: { x: 10, y: 20 }, end: { x: 30, y: 40 }, mode: "fast" }).
 */
export function buildPathQuery(options: BuildPathQueryOptions): string {
  const { mapId, vehicle, start, end, mode } = options;
  assertFiniteNumber("mapId", mapId);
  if (!Number.isInteger(mapId)) {
    throw new Error("Path query requires mapId to be an integer.");
  }

  const vehicleParams = vehicleToPathParams(vehicle);
  const query = new URLSearchParams();

  // Keep this order stable for readable URLs and predictable sharing.
  addNumber(query, "map", mapId);
  query.set("mode", mode);
  addNumber(query, "startX", start.x);
  addNumber(query, "startY", start.y);
  addNumber(query, "endX", end.x);
  addNumber(query, "endY", end.y);
  addNumber(query, "maxSlope", vehicleParams.maxSlope);
  addNumber(query, "maxTherm", vehicleParams.maxTherm);
  addNumber(query, "minTherm", vehicleParams.minTherm);
  addNumber(query, "maxRadiation", vehicleParams.maxRadiation);
  addNumber(query, "maxWind", vehicleParams.maxWind);
  addNumber(query, "speed", vehicleParams.speed);

  assertFiniteNumber("speed", vehicleParams.speed);
  assertFiniteNumber("minTherm", vehicleParams.minTherm);
  assertFiniteNumber("maxTherm", vehicleParams.maxTherm);
  if (vehicleParams.speed <= 0) {
    throw new Error("Path query requires vehicle speed to be greater than 0.");
  }
  if (vehicleParams.minTherm >= vehicleParams.maxTherm) {
    throw new Error("Path query requires minTherm to be less than maxTherm.");
  }

  if (options.step !== undefined) {
    addNumber(query, "step", options.step);
  }

  if (mode === "science") {
    const weights = { ...DEFAULT_SCIENCE_WEIGHTS, ...options.weights };
    addNumber(query, "h2o", weights.h2o);
    addNumber(query, "fe", weights.fe);
    addNumber(query, "si", weights.si);
  }

  return `${API_BASE_URL}/path/?${query.toString()}`;
}

function errorMessageFromBody(body: unknown): string {
  if (typeof body === "string") {
    return body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    for (const value of [record.error, record.message, record.detail]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return "";
}

/** Fetches a built path URL and converts HTML or other failed responses into readable API errors. */
export async function fetchPath(url: string): Promise<PathData> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new ApiError({
      kind: "network",
      message: error instanceof Error ? error.message : "Could not connect to the path API.",
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("json");
  let body: unknown;
  try {
    body = isJson ? await response.json() : await response.text();
  } catch {
    body = "";
  }

  if (!response.ok) {
    const rawMessage = isJson
      ? errorMessageFromBody(body) || `Path request failed (HTTP ${response.status}).`
      : `Path calculation failed (HTTP ${response.status}). Please check the route limits and try again.`;
    throw new ApiError({
      kind: "http",
      status: response.status,
      message: getFriendlyApiMessage(rawMessage),
      details: rawMessage,
    });
  }

  if (!isJson || typeof body !== "object" || body === null) {
    throw new ApiError({
      kind: "parse",
      message: "The path API returned an unreadable response. Please try again.",
      details: typeof body === "string" ? body.slice(0, 500) : undefined,
    });
  }

  return body as PathData;
}
