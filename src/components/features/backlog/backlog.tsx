"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCan } from "@/components/layout/workspace-provider";
import { LabelPill } from "@/components/features/labels/label-pill";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useBacklog, useRankIssue } from "@/hooks/use-backlog";
import { backlogKey, completeSprint, createSprint, deleteSprint, startSprint, updateSprint } from "@/lib/api/sprints";
import { BACKLOG_LIST, findIssue, isList, listOf, points } from "@/lib/backlog";
import { formatDay, toDay } from "@/lib/dates";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { cn } from "@/lib/utils";
import type { BacklogData, BacklogIssue, Sprint } from "@/types/sprint";
import { CompleteSprintDialog, SprintFormDialog } from "./sprint-dialogs";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

/**
 * The backlog: every open sprint as a section, then the backlog. Issues drag between and within sections;
 * each drop is one PATCH /issues/:id/rank (list + neighbours), applied optimistically.
 */
export function Backlog({
  projectId,
  projectKey,
  workspaceSlug,
  initial,
}: {
  projectId: string;
  projectKey: string;
  workspaceSlug: string;
  initial: BacklogData;
}) {
  const queryClient = useQueryClient();
  const { data } = useBacklog(projectId, initial);
  const move = useRankIssue(projectId);
  const canEdit = useCan("editIssues");
  const [activeId, setActiveId] = useState<string | null>(null);
  const href = (key: string) => `/${workspaceSlug}/projects/${projectKey}/issues/${key}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: backlogKey(projectId) });
    queryClient.invalidateQueries({ queryKey: ["board", projectId] });
  };
  const create = useMutation({
    mutationFn: () => createSprint(projectId),
    onSuccess: (s) => {
      toast.success(`${s.name} created`);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const active = activeId ? findIssue(data, activeId) : null;
  const activeIssue = active ? listOf(data, active.listId)[active.index] : null;
  const hasActiveSprint = data.sprints.some((s) => s.status === "active");

  function handleDragEnd({ active: dragged, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const overId = String(over.id);
    if (isList(data, overId)) {
      move(String(dragged.id), overId, listOf(data, overId).length); // empty area of a section → bottom
    } else {
      const at = findIssue(data, overId); // over an issue → take its slot
      if (at) move(String(dragged.id), at.listId, at.index);
    }
  }

  return (
    <DndContext
      id={useId()}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active: a }) => setActiveId(String(a.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-6">
        {data.sprints.map((sprint) => (
          <SprintSection
            key={sprint._id}
            projectId={projectId}
            sprint={sprint}
            plannedSprints={data.sprints.filter((s) => s.status === "planned" && s._id !== sprint._id)}
            canStart={!hasActiveSprint}
            canEdit={canEdit}
            href={href}
            onChanged={refresh}
          />
        ))}

        <Section
          listId={BACKLOG_LIST}
          title="Backlog"
          issues={data.backlog}
          canEdit={canEdit}
          href={href}
          actions={
            canEdit && (
              <Button variant="outline" size="sm" disabled={create.isPending} onClick={() => create.mutate()}>
                <Plus className="size-4" /> Create sprint
              </Button>
            )
          }
          empty="The backlog is empty. New issues land here."
        />
      </div>
      <DragOverlay>{activeIssue ? <IssueLine issue={activeIssue} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function SprintSection({
  projectId,
  sprint,
  plannedSprints,
  canStart,
  canEdit,
  href,
  onChanged,
}: {
  projectId: string;
  sprint: Sprint & { issues: BacklogIssue[] };
  plannedSprints: Sprint[];
  canStart: boolean;
  canEdit: boolean;
  href: (key: string) => string;
  onChanged: () => void;
}) {
  const [dialog, setDialog] = useState<"start" | "edit" | "complete" | null>(null);
  const done = sprint.issues.filter((i) => i.status === "done").length;
  const dates =
    sprint.startDate && sprint.endDate ? `${formatDay(toDay(sprint.startDate))} – ${formatDay(toDay(sprint.endDate))}` : null;

  async function remove() {
    if (!confirm(`Delete ${sprint.name}? Its issues go back to the backlog.`)) return;
    try {
      await deleteSprint(projectId, sprint._id);
      toast.success(`${sprint.name} deleted`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const actions = canEdit && (
    <div className="flex items-center gap-2">
      {sprint.status === "planned" && (
        <Button
          size="sm"
          variant="outline"
          disabled={!canStart}
          title={canStart ? undefined : "Complete the active sprint first"}
          onClick={() => setDialog("start")}
        >
          Start sprint
        </Button>
      )}
      {sprint.status === "active" && (
        <Button size="sm" onClick={() => setDialog("complete")}>
          Complete sprint
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label="Sprint actions" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>Edit sprint</DropdownMenuItem>
          {sprint.status === "planned" && (
            <DropdownMenuItem variant="destructive" onClick={remove}>
              Delete sprint
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <Section
        listId={sprint._id}
        title={sprint.name}
        badge={
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              sprint.status === "active" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground",
            )}
          >
            {sprint.status === "active" ? "Active" : "Planned"}
          </span>
        }
        subtitle={[dates, sprint.goal].filter(Boolean).join(" · ")}
        issues={sprint.issues}
        canEdit={canEdit}
        href={href}
        actions={actions}
        empty="Drag issues here to plan this sprint."
      />
      {dialog === "start" && (
        <SprintFormDialog
          mode="start"
          sprint={sprint}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={async (v) => {
            await startSprint(projectId, sprint._id, v);
            toast.success(`${v.name} started`);
            onChanged();
          }}
        />
      )}
      {dialog === "edit" && (
        <SprintFormDialog
          mode="edit"
          sprint={sprint}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={async (v) => {
            await updateSprint(projectId, sprint._id, v);
            onChanged();
          }}
        />
      )}
      {dialog === "complete" && (
        <CompleteSprintDialog
          sprint={sprint}
          doneCount={done}
          unfinishedCount={sprint.issues.length - done}
          plannedSprints={plannedSprints}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onComplete={async (moveTo) => {
            const result = await completeSprint(projectId, sprint._id, moveTo);
            toast.success(`${sprint.name} completed: ${result.doneIssues} done, ${result.movedIssues} moved`);
            onChanged();
          }}
        />
      )}
    </>
  );
}

/** A droppable list (sprint or backlog) with a sortable list of issues inside. */
function Section({
  listId,
  title,
  badge,
  subtitle,
  issues,
  canEdit,
  href,
  actions,
  empty,
}: {
  listId: string;
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  issues: BacklogIssue[];
  canEdit: boolean;
  href: (key: string) => string;
  actions?: React.ReactNode;
  empty: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: listId, disabled: !canEdit });
  return (
    <section className="rounded-lg border bg-muted/30">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
        <h2 className="font-medium">{title}</h2>
        {badge}
        <span className="text-xs text-muted-foreground">
          {issues.length} issue{issues.length === 1 ? "" : "s"} · {points(issues)} pts
        </span>
        <div className="ml-auto">{actions}</div>
        {subtitle && <p className="w-full text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      <SortableContext id={listId} items={issues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={cn("min-h-14 space-y-1 px-2 pb-2 transition-colors", isOver && "bg-primary/5")}>
          {issues.map((issue) => (
            <SortableLine key={issue._id} issue={issue} href={href(issue.key)} disabled={!canEdit} />
          ))}
          {issues.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{empty}</p>}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableLine({ issue, href, disabled }: { issue: BacklogIssue; href: string; disabled: boolean }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: issue._id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(!disabled && "cursor-grab", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <IssueLine issue={issue} href={href} />
    </div>
  );
}

function IssueLine({ issue, href, dragging }: { issue: BacklogIssue; href?: string; dragging?: boolean }) {
  const type = ISSUE_TYPE_META[issue.type];
  const priority = ISSUE_PRIORITY_META[issue.priority];
  const status = ISSUE_STATUS_META[issue.status];
  const TypeIcon = type.icon!;
  const PriorityIcon = priority.icon!;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm",
        dragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <TypeIcon className={cn("size-4 shrink-0", type.color)} aria-label={type.label} />
      <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{issue.key}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {href ? (
          <Link href={href} className={cn("truncate hover:underline", issue.status === "done" && "line-through opacity-60")}>
            {issue.title}
          </Link>
        ) : (
          <span className="truncate">{issue.title}</span>
        )}
        {issue.labelIds.map((l) => (
          <LabelPill key={l._id} label={l} className="hidden md:inline-flex" />
        ))}
      </span>
      <span className={cn("hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline", status.badge)}>{status.label}</span>
      {issue.storyPoints !== null && (
        <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums" title="Story points">
          {issue.storyPoints}
        </span>
      )}
      <PriorityIcon className={cn("size-4 shrink-0", priority.color)} aria-label={priority.label} />
      <UserAvatar user={issue.assigneeId} size="sm" />
    </div>
  );
}
