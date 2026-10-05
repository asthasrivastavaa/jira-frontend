export const ISSUE_TYPES = ["task", "bug", "story", "epic", "subtask"] as const;
/** Types you can pick freely. A sub-task only exists under a parent, so it's created from the parent's page. */
export const STANDARD_ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;
export const ISSUE_STATUSES = ["todo", "in-progress", "done"] as const;
export const ISSUE_PRIORITIES = ["low", "medium", "high"] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

/** The public part of a user, as the API populates it (never the password hash). */
export interface UserSummary {
  _id: string;
  name: string;
  email: string;
}

export interface Label {
  _id: string;
  name: string;
  color: string;
}

export interface IssueParent {
  _id: string;
  key: string;
  title: string;
  type: IssueType;
  status: IssueStatus;
}

export interface Issue {
  _id: string;
  projectId: string;
  number: number;
  key: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  order: string;
  // the *Id fields come back POPULATED from the API: the id is swapped for the document
  assigneeId: UserSummary | null;
  reporterId: UserSummary | null;
  labelIds: Label[];
  storyPoints: number | null;
  /** ISO string at UTC midnight; the calendar day is its first 10 characters */
  dueDate: string | null;
  /** populated on issue reads; null = backlog */
  sprintId?: { _id: string; name: string; status: "planned" | "active" | "completed" } | null;
  /** populated: an epic (for task/story/bug) or the parent issue (for a sub-task) */
  parentId?: IssueParent | null;
  createdAt: string;
  updatedAt: string;
}

export type BoardIssue = Pick<
  Issue,
  | "_id"
  | "key"
  | "number"
  | "title"
  | "type"
  | "status"
  | "priority"
  | "order"
  | "assigneeId"
  | "labelIds"
  | "storyPoints"
  | "dueDate"
  | "parentId"
>;
export type Board = Record<IssueStatus, BoardIssue[]>;
