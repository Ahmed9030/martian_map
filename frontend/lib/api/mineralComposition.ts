import { buildApiQueryString } from "./client";
import { API_BASE_URL } from "./config";
import { getFriendlyApiMessage } from "./errors";
import type { PathParams } from "./types";

/** Mean mineral percentages along a route, as returned by `GET /path/`. */
export interface MineralComposition {
  h2o: number;
  si: number;
  fe: number;
}

const PATH_ENDPOINT = "/path/";
/** The path endpoint answers 500 when a start or end point is blocked or invalid. */
const BLOCKED_POINTS_STATUS = 500;
const MAX_ERROR_DETAIL_LENGTH = 200;
const ERROR_KEYS = ["error", "message", "detail"] as const;
const MEAN_FIELDS = {
  h2o: "mean_H2O",
  si: "mean_Si",
  fe: "mean_Fe",
} as const;

function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  return configured || API_BASE_URL;
}

function buildMineralUrl(params: PathParams): string {
  const query = buildApiQueryString({ ...params });
  return `${getBaseUrl()}${PATH_ENDPOINT}?${query}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown, field: string): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (value === null || value === "" || !Number.isFinite(numeric)) {
    throw new Error(`The mineral composition response is missing "${field}".`);
  }
  return numeric;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      const body: unknown = await response.json();
      if (!isRecord(body)) {
        return "";
      }
      for (const key of ERROR_KEYS) {
        const candidate = body[key];
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
      return "";
    }
    const text = await response.text();
    return text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_ERROR_DETAIL_LENGTH);
  } catch {
    return "";
  }
}

/**
 * Fetches mean water, silicon and iron percentages for a route from `GET /path/`.
 * Throws a readable Error when the API is unreachable or rejects the route points.
 */
export async function getMineralComposition(
  params: PathParams,
  options: { signal?: AbortSignal } = {},
): Promise<MineralComposition> {
  let response: Response;
  try {
    response = await fetch(buildMineralUrl(params), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(
      "Could not reach the mineral composition API. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    if (response.status === BLOCKED_POINTS_STATUS) {
      throw new Error(
        "Mineral composition is unavailable for the selected start or end point. Choose points inside the map and try again.",
      );
    }
    const detail = await readErrorDetail(response);
    throw new Error(
      detail
        ? getFriendlyApiMessage(detail)
        : `Mineral composition request failed (HTTP ${response.status}).`,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload)) {
    throw new Error("The mineral composition API returned an unreadable response.");
  }

  return {
    h2o: toFiniteNumber(payload[MEAN_FIELDS.h2o], MEAN_FIELDS.h2o),
    si: toFiniteNumber(payload[MEAN_FIELDS.si], MEAN_FIELDS.si),
    fe: toFiniteNumber(payload[MEAN_FIELDS.fe], MEAN_FIELDS.fe),
  };
}
