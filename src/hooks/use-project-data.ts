"use client";

import { useQuery } from "@tanstack/react-query";
import { labelsKey, listLabels } from "@/lib/api/labels";
import { listMembers, membersKey } from "@/lib/api/workspaces";

/**
 * Shared, cached lookups for the pickers. Every assignee picker on a page reads the SAME cache entry,
 * so opening five pickers costs one request, not five.
 */
export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: membersKey(workspaceId),
    queryFn: () => listMembers(workspaceId),
    staleTime: 5 * 60_000, // membership changes rarely
  });
}

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: labelsKey(projectId),
    queryFn: () => listLabels(projectId),
  });
}
