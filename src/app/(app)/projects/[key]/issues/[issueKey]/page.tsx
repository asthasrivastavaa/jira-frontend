import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { IssueDetailMain } from "@/components/features/issues/issue-detail-main";
import { IssueDetailFields } from "@/components/features/issues/issue-detail-fields";
import type { Issue } from "@/types/issue";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ key: string; issueKey: string }>;
}) {
  const { key, issueKey } = await params;
  const projectKey = key.toUpperCase();

  let issue: Issue;
  try {
    issue = await apiFetch<Issue>(`/v1/issues/key/${issueKey}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
  if (!issue.key.startsWith(`${projectKey}-`)) notFound();

  return (
    <div>
      <Link href={`/projects/${projectKey}`} className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← {projectKey}
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
        <IssueDetailMain issue={issue} projectKey={projectKey} />
        <aside className="rounded-lg bg-muted/40 p-4">
          <IssueDetailFields issue={issue} projectKey={projectKey} />
        </aside>
      </div>
    </div>
  );
}
