"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { backlogKey, fetchBacklog, rankIssue } from "@/lib/api/sprints";
import { BACKLOG_LIST, findIssue, listOf, moveIssue } from "@/lib/backlog";
import { neighboursAt } from "@/lib/board";
import type { BacklogData } from "@/types/sprint";

export function useBacklog(projectId: string, initial: BacklogData) {
  const queryClient = useQueryClient();
  // a server re-render (e.g. after "Create issue") brings a fresh snapshot: push it into the cache
  useEffect(() => {
    queryClient.setQueryData(backlogKey(projectId), initial);
  }, [queryClient, projectId, initial]);

  return useQuery({ queryKey: backlogKey(projectId), queryFn: () => fetchBacklog(projectId), initialData: initial });
}

type RankVars = { issueId: string; sprintId: string | null; beforeId?: string; afterId?: string; next: BacklogData };

/** The board's optimistic-move pattern again, with lists = sprints + backlog instead of status columns. */
export function useRankIssue(projectId: string) {
  const queryClient = useQueryClient();
  const key = backlogKey(projectId);
  const mutationKey = ["rank-issue", projectId];

  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ issueId, sprintId, beforeId, afterId }: RankVars) =>
      rankIssue(issueId, { sprintId, beforeId, afterId }),
    onMutate: async ({ next }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BacklogData>(key);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(err instanceof Error ? err.message : "Could not move the issue");
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: key });
        queryClient.invalidateQueries({ queryKey: ["board", projectId] }); // the active sprint's board changed too
      }
    },
  });

  return function move(issueId: string, toList: string, toIndex: number) {
    const data = queryClient.getQueryData<BacklogData>(key);
    const from = data && findIssue(data, issueId);
    if (!data || !from) return;

    const next = moveIssue(data, issueId, toList, toIndex);
    const list = listOf(next, toList);
    const index = list.findIndex((i) => i._id === issueId);
    if (from.listId === toList && from.index === index) return; // dropped where it was

    mutation.mutate({
      issueId,
      sprintId: toList === BACKLOG_LIST ? null : toList,
      ...neighboursAt(list, index),
      next,
    });
  };
}
