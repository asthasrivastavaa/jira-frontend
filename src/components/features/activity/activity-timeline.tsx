"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { activityKey, listActivity } from "@/lib/api/activity";
import type { ActivityEntry, FieldChange } from "@/lib/api/activity";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { formatDay, timeAgo } from "@/lib/dates";

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  type: "type",
  storyPoints: "story points",
  dueDate: "due date",
  assignee: "assignee",
  labels: "labels",
  sprint: "sprint",
  parent: "parent",
};

/** Turns a stored snapshot into text: enum keys -> their labels, days -> "Oct 10", lists -> "A, B". */
function show(field: string, value: unknown): string {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return "None";
  if (Array.isArray(value)) return value.join(", ");
  const v = String(value);
  if (field === "status") return ISSUE_STATUS_META[v as keyof typeof ISSUE_STATUS_META]?.label ?? v;
  if (field === "priority") return ISSUE_PRIORITY_META[v as keyof typeof ISSUE_PRIORITY_META]?.label ?? v;
  if (field === "type") return ISSUE_TYPE_META[v as keyof typeof ISSUE_TYPE_META]?.label ?? v;
  if (field === "dueDate") return formatDay(v);
  return v;
}

function Change({ change }: { change: FieldChange }) {
  const label = FIELD_LABELS[change.field] ?? change.field;
  if (change.field === "description") return <>updated the {label}</>;
  return (
    <>
      changed the {label} from <span className="font-medium text-foreground">{show(change.field, change.from)}</span> to{" "}
      <span className="font-medium text-foreground">{show(change.field, change.to)}</span>
    </>
  );
}

function Entry({ entry }: { entry: ActivityEntry }) {
  return (
    <li className="flex gap-3">
      <UserAvatar user={entry.actorId} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{entry.actorId.name}</span>{" "}
        {entry.type === "created" ? (
          "created the issue"
        ) : entry.changes.length === 1 ? (
          <Change change={entry.changes[0]} />
        ) : (
          <>
            made {entry.changes.length} changes
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {entry.changes.map((c) => (
                <li key={c.field}>
                  <Change change={c} />
                </li>
              ))}
            </ul>
          </>
        )}
        <time className="ml-2 text-xs" dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString()}>
          {timeAgo(entry.createdAt)}
        </time>
      </div>
    </li>
  );
}

/**
 * Read-only history. staleTime 0 + refetch on mount: switching to the History tab always shows the latest.
 * Field saves on the issue page also invalidate this query (see issue-detail-fields.tsx).
 */
export function ActivityTimeline({ issueId }: { issueId: string }) {
  const query = useInfiniteQuery({
    queryKey: activityKey(issueId),
    queryFn: ({ pageParam }) => listActivity(issueId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    staleTime: 0,
  });

  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading history...</p>;
  if (query.isError) return <p className="text-sm text-destructive">Could not load the history.</p>;

  const entries = query.data.pages.flatMap((p) => p.data);
  return (
    <div className="space-y-4">
      <ol className="relative space-y-4 border-l pl-4">
        {entries.map((e) => (
          <Entry key={e._id} entry={e} />
        ))}
      </ol>
      {query.hasNextPage && (
        <Button variant="ghost" size="sm" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? "Loading..." : "Load older history"}
        </Button>
      )}
    </div>
  );
}
