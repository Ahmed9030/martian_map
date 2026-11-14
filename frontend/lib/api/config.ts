export const DEFAULT_API_TIMEOUT_MS = 60_000;

// `NEXT_PUBLIC_API_URL` is the documented public env var; the `_BASE_URL`
// spelling is kept as a fallback for existing deployments.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://raheemelnashar.pythonanywhere.com"
).replace(/\/+$/, "");

export const API_PROXY_PREFIX = "/api";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
