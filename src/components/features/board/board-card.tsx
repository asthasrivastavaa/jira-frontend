"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { ISSUE_PRIORITY_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { formatDay, isOverdue, toDay } from "@/lib/dates";
import { LabelPill } from "@/components/features/labels/label-pill";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { BoardIssue } from "@/types/issue";

export function BoardCard({ issue, href, dragging }: { issue: BoardIssue; href?: string; dragging?: boolean }) {
  const type = ISSUE_TYPE_META[issue.type];
  const priority = ISSUE_PRIORITY_META[issue.priority];
  const TypeIcon = type.icon!;
  const PriorityIcon = priority.icon!;

  return (
    <div
      className={cn(
        "rounded-md border bg-card p-3 text-sm shadow-xs",
        dragging && "rotate-2 cursor-grabbing shadow-lg ring-2 ring-primary/40",
      )}
    >
      {issue.parentId && (
        <p className="mb-1 truncate text-xs text-muted-foreground" title={issue.parentId.title}>
          {issue.parentId.type === "epic" ? "Epic" : "Parent"}: <span className="font-mono">{issue.parentId.key}</span>
        </p>
      )}
      <p className="line-clamp-3">
        {href ? (
          <Link href={href} className="hover:underline">
            {issue.title}
          </Link>
        ) : (
          issue.title
        )}
      </p>
      {issue.labelIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labelIds.map((label) => (
            <LabelPill key={label._id} label={label} />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <TypeIcon className={cn("size-4", type.color)} aria-label={type.label} />
        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
        {issue.dueDate && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              issue.status !== "done" && isOverdue(toDay(issue.dueDate)) && "font-medium text-destructive",
            )}
          >
            {formatDay(toDay(issue.dueDate))}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {issue.storyPoints !== null && (
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums" title="Story points">
              {issue.storyPoints}
            </span>
          )}
          <PriorityIcon className={cn("size-4", priority.color)} aria-label={priority.label} />
          <UserAvatar user={issue.assigneeId} size="sm" />
        </span>
      </div>
    </div>
  );
}

export function SortableCard({ issue, href, disabled }: { issue: BoardIssue; href: string; disabled: boolean }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: issue._id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(!disabled && "cursor-grab", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <BoardCard issue={issue} href={href} />
    </div>
  );
}
