import { apiFetchCursor } from "./client";
import type { UserSummary } from "@/types/issue";

export interface FieldChange {
  field: string;
  /** display snapshot from the time of the change (a name, a list of names, a day...) */
  from: unknown;
  to: unknown;
}

export interface ActivityEntry {
  _id: string;
  actorId: UserSummary; // populated
  type: "created" | "updated";
  changes: FieldChange[];
  createdAt: string;
}

export const activityKey = (issueId: string) => ["activity", issueId] as const;

export const listActivity = (issueId: string, cursor?: string | null) =>
  apiFetchCursor<ActivityEntry[]>(`/v1/issues/${issueId}/activity${cursor ? `?cursor=${cursor}` : ""}`);
