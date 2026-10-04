import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import {  ApiRequestError } from "@/lib/api/client";
import { IssueDetailMain } from "@/components/features/issues/issue-detail-main";
import { IssueDetailFields } from "@/components/features/issues/issue-detail-fields";
import { getWorkspace } from "@/lib/workspace";
import type { Issue } from "@/types/issue";
import type { Project } from "@/types/project";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; key: string; issueKey: string }>;
}) {
  const { workspaceSlug, key, issueKey } = await params;
  const projectKey = key.toUpperCase();

  const workspace = await getWorkspace(workspaceSlug);
  let issue: Issue;
  try {
    const project = await apiFetch<Project>(`/v1/workspaces/${workspace.id}/projects/key/${projectKey}`);
    issue = await apiFetch<Issue>(`/v1/projects/${project._id}/issues/key/${issueKey}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
  if (!issue.key.startsWith(`${projectKey}-`)) notFound();

  return (
    <div>
      <Link href={`/${workspaceSlug}/projects/${projectKey}`}className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
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
