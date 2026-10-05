import { apiFetch } from "./client";
import type { BoardIssue, IssueStatus } from "@/types/issue";

export interface Progress {
  total: number;
  done: number;
  points: number;
  donePoints: number;
}

export interface EpicSummary {
  _id: string;
  key: string;
  title: string;
  status: IssueStatus;
  total: number;
  done: number;
}

export const childrenKey = (issueId: string) => ["children", issueId] as const;
export const epicsKey = (projectId: string) => ["epics", projectId] as const;

export const fetchChildren = (issueId: string) =>
  apiFetch<{ items: BoardIssue[]; progress: Progress }>(`/v1/issues/${issueId}/children`);

export const fetchEpics = (projectId: string) => apiFetch<EpicSummary[]>(`/v1/projects/${projectId}/epics`);
