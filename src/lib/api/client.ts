type ApiSuccess<T> = { success: true; data: T; meta?: unknown };
type ApiErrorBody = { success: false; statusCode: number; message: string; errors?: string[]; retryAfter?: number };

export class ApiRequestError extends Error {
  statusCode: number;
  retryAfter?: number;
  constructor(message: string, statusCode: number, retryAfter?: number) {
    super(message);
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}


function getBaseUrl() {
  const isServer = typeof window === "undefined";
  return isServer ? (process.env.API_INTERNAL_URL ?? "http://localhost:4000/api") : "/api";
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

let refreshPromise: Promise<boolean> | null = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/v1/auth/refresh", { method: "POST" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}


async function request<T>(path: string, options?: RequestInit, canRetry = true): Promise<ApiSuccess<T>> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });

  // Browser only: expired access token -> refresh once, then replay the request.
  // Auth routes are excluded, otherwise a failing /refresh would loop forever.
  if (res.status === 401 && canRetry && typeof window !== "undefined" && !path.startsWith("/v1/auth/")) {
    if (await refreshSession()) return request<T>(path, options, false);
    window.location.assign("/login");
  }

  const json: ApiSuccess<T> | ApiErrorBody = await res.json();
    if (!json.success) throw new ApiRequestError(json.message, json.statusCode, json.retryAfter);

  return json;
}


export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return (await request<T>(path, options)).data;
}

export async function apiFetchPage<T>(path: string, options?: RequestInit): Promise<{ data: T; meta: PageMeta }> {
  const json = await request<T>(path, options);
  return { data: json.data, meta: json.meta as PageMeta };
}

/** Cursor pagination: meta is `{ nextCursor }` (null on the last page). */
export interface CursorMeta {
  nextCursor: string | null;
}

export async function apiFetchCursor<T>(path: string, options?: RequestInit): Promise<{ data: T; meta: CursorMeta }> {
  const json = await request<T>(path, options);
  return { data: json.data, meta: json.meta as CursorMeta };
}

