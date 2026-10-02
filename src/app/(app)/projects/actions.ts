"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";

interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

export async function createProject(input: CreateProjectInput): Promise<{ error?: string }> {
  try {
    await apiFetch("/v1/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/projects");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
export async function updateProject(id: string, input: Partial<CreateProjectInput>): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    revalidatePath("/projects");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${id}`, { method: "DELETE" });
    revalidatePath("/projects");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

