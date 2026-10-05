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
  assigneeId?: string | null;
  labelIds?: string[];
  storyPoints?: number | null;
  /** "YYYY-MM-DD" */
  dueDate?: string | null;
  /** null = backlog */
  sprintId?: string | null;
  /** sub-tasks (3.6) */
  parentId?: string | null;
}

export type UpdateIssueInput = Partial<CreateIssueInput>;

/** Every page that shows issues. Any action that changes issues refreshes all of them. */
function revalidateIssuePages() {
  revalidatePath("/[workspaceSlug]/projects/[key]", "page");
  revalidatePath("/[workspaceSlug]/projects/[key]/board", "page");
  revalidatePath("/[workspaceSlug]/projects/[key]/backlog", "page");
  revalidatePath("/[workspaceSlug]/projects/[key]/issues/[issueKey]", "page");
}

export async function createIssue(
  projectId: string,
  projectKey: string,
  input: CreateIssueInput,
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/projects/${projectId}/issues`, { method: "POST", body: JSON.stringify(input) });
    revalidateIssuePages();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function updateIssue(
  id: string,
  projectKey: string,
  issueKey: string,
  input: UpdateIssueInput,
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/issues/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    revalidateIssuePages();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function deleteIssue(id: string, projectKey: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/issues/${id}`, { method: "DELETE" });
    revalidateIssuePages();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
