import { apiFetch } from "./client";
import type { Board, BoardIssue, IssueStatus } from "@/types/issue";

export type MoveIssueBody = { status: IssueStatus; beforeId?: string; afterId?: string };

/** Board filters that change WHICH cards are loaded. Each combination is its own cache entry. */
export interface BoardFilter {
  /** only issues assigned to me */
  mine: boolean;
}

export const boardKey = (projectId: string, filter: BoardFilter) => ["board", projectId, filter] as const;

export function boardQueryString(filter: BoardFilter) {
  return filter.mine ? "?assignee=me" : "";
}

export function fetchBoard(projectId: string, filter: BoardFilter) {
  return apiFetch<Board>(`/v1/projects/${projectId}/board${boardQueryString(filter)}`);
}

export function moveIssue(issueId: string, body: MoveIssueBody) {
  return apiFetch<BoardIssue>(`/v1/issues/${issueId}/move`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
