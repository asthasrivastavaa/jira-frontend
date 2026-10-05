"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { ISSUE_STATUS_META } from "@/lib/issue-meta";
import { SortableCard } from "./board-card";
import type { BoardIssue, IssueStatus } from "@/types/issue";

export function BoardColumn({
  status,
  issues,
  issueHref,
  canEdit,
}: {
  status: IssueStatus;
  issues: BoardIssue[];
  issueHref: (key: string) => string;
  canEdit: boolean;
}) {
  const meta = ISSUE_STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !canEdit });

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <header className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
        <span className={cn("size-2 rounded-full", meta.dot)} />
        {meta.label}
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 tabular-nums">{issues.length}</span>
      </header>
      <SortableContext id={status} items={issues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors", isOver && "bg-primary/5")}
        >
          {issues.map((issue) => (
            <SortableCard key={issue._id} issue={issue} href={issueHref(issue.key)} disabled={!canEdit} />
          ))}
          {issues.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No issues</p>}
        </div>
      </SortableContext>
    </section>
  );
}
