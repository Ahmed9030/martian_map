export type ApiErrorKind =
  | "network"
  | "timeout"
  | "aborted"
  | "http"
  | "parse"
  | "api";

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  details?: string | Record<string, unknown>;
}

const KNOWN_API_ERRORS: Array<[RegExp, string]> = [
  [/Start\/End coordinate is outside the raster/i, "The start or end point is outside the map raster."],
  [/Start\/End point has missing elevation/i, "One of the start or end points is missing elevation data."],
  [/exceeds the slope limit|exceeds safe operational limits/i, "The route exceeds the safe slope or temperature limits."],
  [/No traversable terrain found/i, "No traversable terrain matches the requested route limits."],
  [/No valid elevation data found/i, "No valid elevation data is available for this map region."],
  [/speed.*(must be|> 0)|ZeroDivisionError/i, "The route speed must be greater than zero."],
];

export function getFriendlyApiMessage(rawMessage: string): string {
  const normalized = rawMessage.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "The API request failed.";
  }

  const match = KNOWN_API_ERRORS.find(([pattern]) => pattern.test(normalized));
  if (match) {
    return match[1];
  }

  return normalized;
}

export class ApiError extends Error {
  public readonly kind: ApiErrorKind;
  public readonly status?: number;
  public readonly details?: string | Record<string, unknown>;

  constructor({ kind, message, status, details }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
