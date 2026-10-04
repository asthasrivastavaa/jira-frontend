import { apiFetch } from "./client";

// Browser-side project calls (onboarding and settings). Server components and Server Actions
// use `@/lib/api/server` instead, so cookies are forwarded.
export const createProjectInWorkspace = (
  workspaceId: string,
  body: { name: string; key: string; description?: string },
) =>
  apiFetch<{ _id: string; key: string; name: string }>(`/v1/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify(body),
  });

// the project KEY is not here on purpose: it can never change (issue keys are built from it)
export const updateProjectSettings = (
  id: string,
  body: { name?: string; description?: string; leadId?: string | null },
) => apiFetch<{ _id: string }>(`/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteProjectById = (id: string) =>
  apiFetch<{ id: string }>(`/v1/projects/${id}`, { method: "DELETE" });
