import { ISSUE_STATUSES } from "@/types/issue";
import type { Board, BoardIssue, IssueStatus } from "@/types/issue";

/** Which column a card is in, and at which position. */
export function findCard(board: Board, issueId: string) {
  for (const status of ISSUE_STATUSES) {
    const index = board[status].findIndex((i) => i._id === issueId);
    if (index !== -1) return { status, index };
  }
  return null;
}

/** A NEW board with the card taken out of its column and inserted at `toIndex` of `toStatus`. */
export function moveCard(board: Board, issueId: string, toStatus: IssueStatus, toIndex: number): Board {
  const from = findCard(board, issueId);
  if (!from) return board;
  const card = board[from.status][from.index];

  const next: Board = { ...board, [from.status]: board[from.status].filter((i) => i._id !== issueId) };
  const target = [...next[toStatus]];
  target.splice(Math.min(toIndex, target.length), 0, { ...card, status: toStatus });
  next[toStatus] = target;
  return next;
}

/** The cards directly above and below `index`: exactly what PATCH /move expects. */
export function neighboursAt(column: BoardIssue[], index: number) {
  return { beforeId: column[index - 1]?._id, afterId: column[index + 1]?._id };
}
