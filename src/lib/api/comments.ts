import { apiFetch, apiFetchCursor } from "./client";
import type { UserSummary } from "@/types/issue";

export interface Comment {
  _id: string;
  issueId: string;
  authorId: UserSummary; // populated
  /** sanitized HTML */
  body: string;
  editedAt: string | null;
  createdAt: string;
}

export const commentsKey = (issueId: string) => ["comments", issueId] as const;

export const listComments = (issueId: string, cursor?: string | null) =>
  apiFetchCursor<Comment[]>(`/v1/issues/${issueId}/comments${cursor ? `?cursor=${cursor}` : ""}`);

export const createComment = (issueId: string, body: string) =>
  apiFetch<Comment>(`/v1/issues/${issueId}/comments`, { method: "POST", body: JSON.stringify({ body }) });

export const updateComment = (issueId: string, commentId: string, body: string) =>
  apiFetch<Comment>(`/v1/issues/${issueId}/comments/${commentId}`, { method: "PATCH", body: JSON.stringify({ body }) });

export const deleteComment = (issueId: string, commentId: string) =>
  apiFetch<{ id: string }>(`/v1/issues/${issueId}/comments/${commentId}`, { method: "DELETE" });
