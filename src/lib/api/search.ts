import { apiFetch } from "./client";
import type { IssueStatus, IssueType } from "@/types/issue";
import type { Project } from "@/types/project";

export interface SearchResults {
  issues: { _id: string; key: string; title: string; type: IssueType; status: IssueStatus; projectKey: string }[];
  projects: Pick<Project, "_id" | "name" | "key">[];
}

export const searchKey = (workspaceId: string, q: string) => ["search", workspaceId, q] as const;

export const searchWorkspace = (workspaceId: string, q: string) =>
  apiFetch<SearchResults>(`/v1/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`);

export const projectsKey = (workspaceId: string) => ["projects", workspaceId] as const;

export const listProjects = (workspaceId: string) => apiFetch<Project[]>(`/v1/workspaces/${workspaceId}/projects`);
