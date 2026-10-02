type ApiSuccess<T> = { success: true; data: T; meta?: unknown };
type ApiError = { success: false; statusCode: number; message: string; errors?: string[] };

function getBaseUrl() {
  const isServer = typeof window === "undefined";
  return isServer ? (process.env.API_INTERNAL_URL ?? "http://localhost:4000/api") : "/api";
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  const json: ApiSuccess<T> | ApiError = await res.json();

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}
