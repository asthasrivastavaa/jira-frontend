import Link from "next/link";
import { cn } from "@/lib/utils";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { IssueRowMenu } from "./issue-row-menu";
import type { Issue } from "@/types/issue";

export function IssueRow({
  issue,
  projectKey,
  workspaceSlug,
}: {
  issue: Issue;
  projectKey: string;
  workspaceSlug: string;
}) {
  const type = ISSUE_TYPE_META[issue.type];
  const priority = ISSUE_PRIORITY_META[issue.priority];
  const status = ISSUE_STATUS_META[issue.status];
  const TypeIcon = type.icon!;
  const PriorityIcon = priority.icon!;

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50">
      <Link href={`/${workspaceSlug}/projects/${projectKey}/issues/${issue.key}`}className="flex min-w-0 flex-1 items-center gap-3">
        <TypeIcon className={cn("size-4 shrink-0", type.color)} aria-label={type.label} />
        <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{issue.key}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
  <span className="truncate">{issue.title}</span>
  {issue.labels?.map((label) => (
    <span key={label} className="shrink-0 rounded bg-muted px-1.5 text-xs text-muted-foreground">
      {label}
    </span>
  ))}
</span>

        <PriorityIcon className={cn("size-4 shrink-0", priority.color)} aria-label={priority.label} />
        <span className={cn("w-24 rounded-full px-2 py-0.5 text-center text-xs font-medium", status.badge)}>
          {status.label}
        </span>
      </Link>
      <IssueRowMenu issue={issue} projectKey={projectKey} />
    </div>
  );
}

