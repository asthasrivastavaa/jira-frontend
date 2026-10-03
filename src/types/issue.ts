export const ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;
export const ISSUE_STATUSES = ["todo", "in-progress", "done"] as const;
export const ISSUE_PRIORITIES = ["low", "medium", "high"] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export interface Issue {
  _id: string;
  projectId: string;
  number: number;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  labels?:string[];
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
}
