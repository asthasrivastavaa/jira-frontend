"use client";

import { createContext, useContext } from "react";
import { can, type Action } from "@/lib/permissions";
import type { Workspace } from "@/lib/api/workspaces";

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ workspace, children }: { workspace: Workspace; children: React.ReactNode }) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return workspace;
}

/** `const canEdit = useCan("editIssues")` */
export function useCan(action: Action) {
  return can(useWorkspace().role, action);
}
