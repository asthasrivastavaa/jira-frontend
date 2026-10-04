import "server-only";
import { cookies } from "next/headers";
import { apiFetch as baseFetch, apiFetchPage as basePage } from "./client";

async function withCookies(options?: RequestInit): Promise<RequestInit> {
  const jar = await cookies();
  const cookie = jar.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  return { ...options, headers: { ...options?.headers, cookie } };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return baseFetch<T>(path, await withCookies(options));
}

export async function apiFetchPage<T>(path: string, options?: RequestInit) {
  return basePage<T>(path, await withCookies(options));
}
