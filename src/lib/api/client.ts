type ApiSuccess<T> = { success: true; data: T; meta?: unknown };
type ApiErrorBody = { success: false; statusCode: number; message: string; errors?: string[] };

export class ApiRequestError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
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

async function request<T>(path: string, options?: RequestInit): Promise<ApiSuccess<T>> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const json: ApiSuccess<T> | ApiErrorBody = await res.json();
  if (!json.success) throw new ApiRequestError(json.message, json.statusCode);
  return json;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return (await request<T>(path, options)).data;
}

export async function apiFetchPage<T>(path: string, options?: RequestInit): Promise<{ data: T; meta: PageMeta }> {
  const json = await request<T>(path, options);
  return { data: json.data, meta: json.meta as PageMeta };
}

