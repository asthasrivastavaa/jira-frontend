import type { WorkspaceRole } from "@/lib/api/workspaces";

// viewer < member < admin < owner. This only decides what the UI SHOWS.
// The real checks are on the server (WorkspaceRoleGuard / ProjectMemberGuard).
const RANK: Record<WorkspaceRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

export type Action =
  | "editIssues" // create / edit / delete issues
  | "manageProjects" // create / edit / delete projects
  | "manageMembers" // invite, change roles, remove members
  | "manageWorkspace" // name and URL
  | "ownerOnly"; // transfer ownership, delete the workspace

const MIN_ROLE: Record<Action, WorkspaceRole> = {
  editIssues: "member",
  manageProjects: "admin",
  manageMembers: "admin",
  manageWorkspace: "admin",
  ownerOnly: "owner",
};

export const hasRole = (role: WorkspaceRole, min: WorkspaceRole) => RANK[role] >= RANK[min];
export const can = (role: WorkspaceRole, action: Action) => hasRole(role, MIN_ROLE[action]);
