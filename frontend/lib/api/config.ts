export const DEFAULT_API_TIMEOUT_MS = 60_000;

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://raheemelnashar.pythonanywhere.com"
).replace(/\/+$/, "");

export const API_PROXY_PREFIX = "/api";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
