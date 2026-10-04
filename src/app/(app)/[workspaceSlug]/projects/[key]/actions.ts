"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/server";
import type { IssuePriority, IssueStatus, IssueType } from "@/types/issue";

interface CreateIssueInput {
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  labels?: string[];
}


export async function createIssue(
  projectId: string,
  projectKey: string,
  input: CreateIssueInput,
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${projectId}/issues`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/[workspaceSlug]/projects/[key]", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
export type UpdateIssueInput = Partial<CreateIssueInput>;

export async function updateIssue(
  id: string,
  projectKey: string,
  issueKey: string,
  input: UpdateIssueInput,
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/issues/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    revalidatePath("/[workspaceSlug]/projects/[key]", "page");
    revalidatePath("/[workspaceSlug]/projects/[key]/issues/[issueKey]", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteIssue(id: string, projectKey: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/issues/${id}`, { method: "DELETE" });
    revalidatePath("/[workspaceSlug]/projects/[key]", "page");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

