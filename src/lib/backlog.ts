import type { BacklogData, BacklogIssue } from "@/types/sprint";

/** Each droppable list on the backlog page: a sprint (its id) or the backlog itself. */
export const BACKLOG_LIST = "backlog";

export function listOf(data: BacklogData, listId: string): BacklogIssue[] {
  if (listId === BACKLOG_LIST) return data.backlog;
  return data.sprints.find((s) => s._id === listId)?.issues ?? [];
}

export function isList(data: BacklogData, id: string) {
  return id === BACKLOG_LIST || data.sprints.some((s) => s._id === id);
}

/** Which list an issue is in, and where. */
export function findIssue(data: BacklogData, issueId: string) {
  for (const listId of [...data.sprints.map((s) => s._id), BACKLOG_LIST]) {
    const index = listOf(data, listId).findIndex((i) => i._id === issueId);
    if (index !== -1) return { listId, index };
  }
  return null;
}

/** A NEW BacklogData with the issue taken out of its list and inserted at `toIndex` of `toList`. Pure. */
export function moveIssue(data: BacklogData, issueId: string, toList: string, toIndex: number): BacklogData {
  const from = findIssue(data, issueId);
  if (!from) return data;
  const issue = listOf(data, from.listId)[from.index];
  const moved = { ...issue, sprintId: toList === BACKLOG_LIST ? null : toList };

  const without = (list: BacklogIssue[]) => list.filter((i) => i._id !== issueId);
  const insert = (list: BacklogIssue[]) => {
    const copy = [...list];
    copy.splice(Math.min(toIndex, copy.length), 0, moved);
    return copy;
  };
  const update = (listId: string, list: BacklogIssue[]) => {
    const base = without(list);
    return listId === toList ? insert(base) : base;
  };

  return {
    sprints: data.sprints.map((s) => ({ ...s, issues: update(s._id, s.issues) })),
    backlog: update(BACKLOG_LIST, data.backlog),
  };
}

export const points = (issues: BacklogIssue[]) => issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
