import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import { ApiRequestError } from "@/lib/api/client";
import type { Workspace } from "@/lib/api/workspaces";

export const getWorkspace = cache(async (slug: string): Promise<Workspace> => {
  try {
    return await apiFetch<Workspace>(`/v1/workspaces/slug/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
});
