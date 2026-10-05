"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useCan } from "@/components/layout/workspace-provider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CreateIssueDialog } from "./create-issue-dialog";
import { updateIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import { activityKey } from "@/lib/api/activity";
import { childrenKey, fetchChildren } from "@/lib/api/hierarchy";
import type { Progress } from "@/lib/api/hierarchy";
import { ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types/issue";

function ProgressBar({ progress }: { progress: Progress }) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
        aria-label="Done"
      >
        <div className="h-full rounded-full bg-green-500 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {progress.done}/{progress.total} done
        {progress.points > 0 && ` · ${progress.donePoints}/${progress.points} pts`}
      </span>
    </div>
  );
}

/**
 * For a task/story/bug: its SUB-TASKS as a checklist (tick = done, struck through).
 * For an epic: its CHILD ISSUES with their status.
 * Both show the aggregated progress from GET /issues/:id/children.
 */
export function ChildIssues({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const canEdit = useCan("editIssues");
  const isEpic = issue.type === "epic";
  const { data } = useQuery({ queryKey: childrenKey(issue._id), queryFn: () => fetchChildren(issue._id) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: childrenKey(issue._id) });

  async function toggle(child: { _id: string; key: string }, done: boolean) {
    const result = await updateIssue(child._id, projectKey, child.key, { status: done ? "done" : "todo" });
    if (result.error) toast.error(result.error);
    refresh();
    queryClient.invalidateQueries({ queryKey: activityKey(child._id) });
  }

  const title = isEpic ? "Child issues" : "Sub-tasks";
  const items = data?.items ?? [];

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-muted-foreground uppercase">{title}</h2>
        {canEdit && (
          <CreateIssueDialog
            projectId={issue.projectId}
            projectKey={projectKey}
            defaults={isEpic ? { parentId: issue._id } : { type: "subtask", parentId: issue._id }}
            triggerLabel={isEpic ? "Add child issue" : "Create sub-task"}
            triggerVariant="outline"
            onCreated={refresh}
          />
        )}
      </div>

      {data && data.progress.total > 0 && <ProgressBar progress={data.progress} />}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isEpic ? "No child issues yet." : "No sub-tasks yet."}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((child) => {
            const done = child.status === "done";
            const type = ISSUE_TYPE_META[child.type];
            const TypeIcon = type.icon!;
            return (
              <li key={child._id} className="flex items-center gap-3 px-3 py-2 text-sm">
                {isEpic ? (
                  <TypeIcon className={cn("size-4 shrink-0", type.color)} aria-label={type.label} />
                ) : (
                  <Checkbox
                    checked={done}
                    disabled={!canEdit}
                    aria-label={`Mark ${child.key} as ${done ? "not done" : "done"}`}
                    onCheckedChange={(v) => toggle(child, v === true)}
                  />
                )}
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{child.key}</span>
                <Link
                  href={`/${workspaceSlug}/projects/${projectKey}/issues/${child.key}`}
                  className={cn("min-w-0 flex-1 truncate hover:underline", done && "text-muted-foreground line-through")}
                >
                  {child.title}
                </Link>
                {isEpic && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ISSUE_STATUS_META[child.status].badge)}>
                    {ISSUE_STATUS_META[child.status].label}
                  </span>
                )}
                <UserAvatar user={child.assigneeId} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
