import type { BoardIssue } from "./issue";

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  _id: string;
  projectId: string;
  name: string;
  goal: string;
  status: SprintStatus;
  /** ISO at UTC midnight (a calendar day), like due dates */
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  summary: { doneIssues: number; doneStoryPoints: number; movedIssues: number } | null;
  createdAt: string;
}

export type BacklogIssue = BoardIssue & { sprintId: string | null };

export interface BacklogData {
  sprints: (Sprint & { issues: BacklogIssue[] })[];
  /** issues in no sprint that aren't done */
  backlog: BacklogIssue[];
}
