"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { boardKey, fetchBoard, moveIssue } from "@/lib/api/board";
import type { BoardFilter } from "@/lib/api/board";
import { findCard, moveCard, neighboursAt } from "@/lib/board";
import type { Board, IssueStatus } from "@/types/issue";

export function useBoard(projectId: string, filter: BoardFilter, initialBoard: Board) {
  const queryClient = useQueryClient();
  const key = boardKey(projectId, filter);

  // a server re-render (e.g. after "Create issue") brings a fresh snapshot: push it into the cache
  useEffect(() => {
    queryClient.setQueryData(boardKey(projectId, filter), initialBoard);
    // filter is an object: depend on its value, not its identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, projectId, filter.mine, initialBoard]);

  return useQuery({
    queryKey: key,
    queryFn: () => fetchBoard(projectId, filter),
    initialData: initialBoard,
  });
}

type MoveVars = { issueId: string; status: IssueStatus; beforeId?: string; afterId?: string; next: Board };

/**
 * With a filter on ("My issues"), the neighbours are the VISIBLE cards around the drop spot.
 * Hidden cards between them don't matter: the new order key still lands between those two,
 * so the card shows up in the right place in the filtered view and somewhere sensible in the full one.
 */
export function useMoveIssue(projectId: string, filter: BoardFilter) {
  const queryClient = useQueryClient();
  const key = boardKey(projectId, filter);
  const mutationKey = ["move-issue", projectId];

  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ issueId, status, beforeId, afterId }: MoveVars) =>
      moveIssue(issueId, { status, beforeId, afterId }),

    onMutate: async ({ next }) => {
      await queryClient.cancelQueries({ queryKey: key }); // an in-flight refetch must not overwrite us
      const previous = queryClient.getQueryData<Board>(key);
      queryClient.setQueryData(key, next); // the card moves NOW
      return { previous }; // handed to onError as `context`
    },

    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous); // snap back
      toast.error(err instanceof Error ? err.message : "Could not move the issue");
    },

    onSettled: () => {
      // several quick drags: only the last one to finish resyncs with the server.
      // ["board", projectId] (no filter) matches every filtered variant, so they all refresh.
      if (queryClient.isMutating({ mutationKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      }
    },
  });

  return function move(issueId: string, toStatus: IssueStatus, toIndex: number) {
    const board = queryClient.getQueryData<Board>(key);
    const from = board && findCard(board, issueId);
    if (!board || !from) return;

    const next = moveCard(board, issueId, toStatus, toIndex);
    const index = next[toStatus].findIndex((i) => i._id === issueId);
    if (from.status === toStatus && from.index === index) return; // dropped where it was

    mutation.mutate({ issueId, status: toStatus, ...neighboursAt(next[toStatus], index), next });
  };
}
