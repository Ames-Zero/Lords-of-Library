function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || "http://localhost:8000";

export function getBackendApiBaseUrl(): string {
  return normalizeBaseUrl(BACKEND_API_BASE_URL);
}

export function toBackendUrl(pathname: string, search = ""): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getBackendApiBaseUrl()}${normalizedPath}${search}`;
}
