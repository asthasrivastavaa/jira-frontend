import { apiFetch } from "./client";
import type { AuthUser } from "./auth";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type InviteRole = Exclude<WorkspaceRole, "owner">;

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  onboardingCompleted: boolean;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: InviteRole;
  status: "pending" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface InviteResult {
  email: string;
  status: "sent" | "resent" | "already_member";
}

export interface InvitePreview {
  workspaceName: string;
  email: string;
  role: InviteRole;
  hasAccount: boolean;
}

export const createWorkspace = (body: { name: string; slug: string }) =>
  apiFetch<Workspace>("/v1/workspaces", { method: "POST", body: JSON.stringify(body) });

export const checkSlug = (slug: string) =>
  apiFetch<{ available: boolean }>(`/v1/workspaces/slug-available?slug=${encodeURIComponent(slug)}`);

export const completeOnboarding = (id: string) =>
  apiFetch<{ completed: boolean }>(`/v1/workspaces/${id}/onboarding/complete`, { method: "POST" });

// ---- members & invites ----

export const inviteMembers = (workspaceId: string, body: { emails: string[]; role: InviteRole }) =>
  apiFetch<InviteResult[]>(`/v1/workspaces/${workspaceId}/invites`, { method: "POST", body: JSON.stringify(body) });

export const revokeInvite = (workspaceId: string, inviteId: string) =>
  apiFetch<{ id: string }>(`/v1/workspaces/${workspaceId}/invites/${inviteId}`, { method: "DELETE" });

export const resendInvite = (workspaceId: string, inviteId: string) =>
  apiFetch<{ id: string }>(`/v1/workspaces/${workspaceId}/invites/${inviteId}/resend`, { method: "POST" });

export const changeMemberRole = (workspaceId: string, userId: string, role: InviteRole) =>
  apiFetch<{ userId: string; role: InviteRole }>(`/v1/workspaces/${workspaceId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const removeMember = (workspaceId: string, userId: string) =>
  apiFetch<{ userId: string }>(`/v1/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });

export const acceptInvite = (token: string) =>
  apiFetch<Workspace>("/v1/invites/accept", { method: "POST", body: JSON.stringify({ token }) });

export const registerWithInvite = (body: { token: string; name: string; password: string }) =>
  apiFetch<{ user: AuthUser; workspace: Workspace }>("/v1/auth/register-with-invite", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ---- settings (2.8) ----

export const updateWorkspace = (id: string, body: { name?: string; slug?: string }) =>
  apiFetch<Workspace>(`/v1/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const transferOwnership = (id: string, userId: string) =>
  apiFetch<{ ownerId: string }>(`/v1/workspaces/${id}/transfer`, { method: "POST", body: JSON.stringify({ userId }) });

export const deleteWorkspace = (id: string) =>
  apiFetch<{ id: string }>(`/v1/workspaces/${id}`, { method: "DELETE" });
