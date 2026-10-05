"use client";

import { createContext, useContext } from "react";
import { can, type Action } from "@/lib/permissions";
import type { Workspace } from "@/lib/api/workspaces";
import type { AuthUser } from "@/lib/api/auth";

const WorkspaceContext = createContext<{ workspace: Workspace; user: AuthUser } | null>(null);

/** Fed by the [workspaceSlug] layout: the current workspace (with my role in it) and the logged-in user. */
export function WorkspaceProvider({
  workspace,
  user,
  children,
}: {
  workspace: Workspace;
  user: AuthUser;
  children: React.ReactNode;
}) {
  return <WorkspaceContext.Provider value={{ workspace, user }}>{children}</WorkspaceContext.Provider>;
}

function useWorkspaceContext() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return value;
}

export function useWorkspace() {
  return useWorkspaceContext().workspace;
}

/** The logged-in user (e.g. to show "edit" only on your own comments). */
export function useCurrentUser() {
  return useWorkspaceContext().user;
}

/** `const canEdit = useCan("editIssues")` */
export function useCan(action: Action) {
  return can(useWorkspace().role, action);
}
