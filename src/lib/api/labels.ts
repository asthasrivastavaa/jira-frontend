import { apiFetch } from "./client";
import type { Label } from "@/types/issue";

/** Same palette as the API's LABEL_COLORS: every color is readable as text on a tinted pill. */
export const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;

export const labelsKey = (projectId: string) => ["labels", projectId] as const;

export const listLabels = (projectId: string) => apiFetch<Label[]>(`/v1/projects/${projectId}/labels`);

export const createLabel = (projectId: string, body: { name: string; color: string }) =>
  apiFetch<Label>(`/v1/projects/${projectId}/labels`, { method: "POST", body: JSON.stringify(body) });

export const updateLabel = (projectId: string, labelId: string, body: { name?: string; color?: string }) =>
  apiFetch<Label>(`/v1/projects/${projectId}/labels/${labelId}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteLabel = (projectId: string, labelId: string) =>
  apiFetch<{ id: string }>(`/v1/projects/${projectId}/labels/${labelId}`, { method: "DELETE" });
