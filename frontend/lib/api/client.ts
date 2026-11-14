import { API_BASE_URL, DEFAULT_API_TIMEOUT_MS, buildApiUrl } from "./config";
import { ApiError, getFriendlyApiMessage } from "./errors";

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type QueryValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryValue>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildQueryString(params: QueryParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "number" && !Number.isFinite(value)) {
      continue;
    }

    query.set(key, String(value));
  }

  return query.toString();
}

function getResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse =
    contentType.includes("application/json") ||
    contentType.includes("application/problem+json") ||
    contentType.includes("+json");

  if (isJsonResponse) {
    return response.json();
  }

  return response.text();
}

function getErrorPayload(body: unknown): string {
  if (typeof body === "string") {
    return body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (isRecord(body)) {
    const candidates = [body.error, body.message, body.detail, body.non_field_errors];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
      if (Array.isArray(candidate)) {
        const firstString = candidate.find((item) => typeof item === "string");
        if (typeof firstString === "string" && firstString.trim().length > 0) {
          return firstString;
        }
      }
    }
  }

  return "";
}

export async function apiGet<T>(
  path: string,
  params: QueryParams = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortListener = (): void => {
    controller.abort();
  };

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  try {
    const queryString = buildQueryString(params);
    const baseUrl = buildApiUrl(path);
    const requestUrl = queryString
      ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${queryString}`
      : baseUrl;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await getResponseBody(response);
      } catch {
        payload = "";
      }

      const rawMessage = getErrorPayload(payload) || `HTTP ${response.status}`;
      const friendlyMessage = getFriendlyApiMessage(rawMessage);
      const details = rawMessage || `HTTP ${response.status}`;

      throw new ApiError({
        kind: "http",
        status: response.status,
        message: friendlyMessage,
        details,
      });
    }

    try {
      const payload = await getResponseBody(response);
      return payload as T;
    } catch (error) {
      throw new ApiError({
        kind: "parse",
        message: "The API response was not valid JSON.",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      if (timedOut) {
        throw new ApiError({
          kind: "timeout",
          message: `The API request timed out after ${timeoutMs} ms.`,
          status: 408,
        });
      }

      throw new ApiError({
        kind: "aborted",
        message: "The API request was cancelled.",
      });
    }

    if (error instanceof Error) {
      throw new ApiError({
        kind: "network",
        message: `Network error while requesting ${API_BASE_URL}${path}: ${error.message}`,
        details: error.message,
      });
    }

    throw new ApiError({
      kind: "api",
      message: "Unexpected API error.",
    });
  } finally {
    if (options.signal) {
      options.signal.removeEventListener("abort", abortListener);
    }
    globalThis.clearTimeout(timeoutId);
  }
}

export function buildApiQueryString(params: QueryParams): string {
  return buildQueryString(params);
}

/**
 * Sends a JSON or form-encoded POST and normalises failures into `ApiError`,
 * mirroring `apiGet`.
 */
export async function apiPost<T>(
  path: string,
  body: Record<string, string> = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await getResponseBody(response);
      } catch {
        payload = "";
      }

      const rawMessage = getErrorPayload(payload) || `HTTP ${response.status}`;
      throw new ApiError({
        kind: "http",
        status: response.status,
        message: getFriendlyApiMessage(rawMessage),
        details: rawMessage,
      });
    }

    try {
      const payload = await getResponseBody(response);
      return payload as T;
    } catch (error) {
      throw new ApiError({
        kind: "parse",
        message: "The API response was not valid JSON.",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        kind: timedOut ? "timeout" : "aborted",
        status: timedOut ? 408 : undefined,
        message: timedOut
          ? `The API request timed out after ${timeoutMs} ms.`
          : "The API request was cancelled.",
      });
    }

    if (error instanceof Error) {
      throw new ApiError({
        kind: "network",
        message: `Network error while requesting ${API_BASE_URL}${path}: ${error.message}`,
        details: error.message,
      });
    }

    throw new ApiError({ kind: "api", message: "Unexpected API error." });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
