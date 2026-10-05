import { apiFetch } from "./client";
import type { BacklogData, Sprint } from "@/types/sprint";

export const backlogKey = (projectId: string) => ["backlog", projectId] as const;

export const fetchBacklog = (projectId: string) => apiFetch<BacklogData>(`/v1/projects/${projectId}/backlog`);

export const createSprint = (projectId: string, body: { name?: string; goal?: string } = {}) =>
  apiFetch<Sprint>(`/v1/projects/${projectId}/sprints`, { method: "POST", body: JSON.stringify(body) });

export interface SprintDates {
  name?: string;
  goal?: string;
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
}

export const updateSprint = (projectId: string, sprintId: string, body: Partial<SprintDates>) =>
  apiFetch<Sprint>(`/v1/projects/${projectId}/sprints/${sprintId}`, { method: "PATCH", body: JSON.stringify(body) });

export const startSprint = (projectId: string, sprintId: string, body: SprintDates) =>
  apiFetch<Sprint>(`/v1/projects/${projectId}/sprints/${sprintId}/start`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** moveTo: "backlog" or a planned sprint's id */
export const completeSprint = (projectId: string, sprintId: string, moveTo: string) =>
  apiFetch<{ id: string; doneIssues: number; doneStoryPoints: number; movedIssues: number }>(
    `/v1/projects/${projectId}/sprints/${sprintId}/complete`,
    { method: "POST", body: JSON.stringify({ moveTo }) },
  );

export const deleteSprint = (projectId: string, sprintId: string) =>
  apiFetch<{ id: string }>(`/v1/projects/${projectId}/sprints/${sprintId}`, { method: "DELETE" });

/** Backlog drag & drop: into a sprint (or null = backlog), between two issues of that list. */
export const rankIssue = (issueId: string, body: { sprintId: string | null; beforeId?: string; afterId?: string }) =>
  apiFetch<{ id: string }>(`/v1/issues/${issueId}/rank`, { method: "PATCH", body: JSON.stringify(body) });
