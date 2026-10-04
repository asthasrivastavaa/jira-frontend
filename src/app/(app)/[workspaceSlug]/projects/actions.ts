"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/server";

interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

export async function createProject(workspaceId: string, input: CreateProjectInput): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/[workspaceSlug]/projects", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
export async function updateProject(id: string, input: Partial<CreateProjectInput>): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    revalidatePath("/[workspaceSlug]/projects", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${id}`, { method: "DELETE" });
    revalidatePath("/[workspaceSlug]/projects", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

