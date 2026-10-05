import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { ProjectViewNav } from "@/components/features/projects/project-view-nav";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch, apiFetchPage } from "@/lib/api/server";
import { ApiRequestError } from "@/lib/api/client";
import { getWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";
import { hasActiveFilters, PAGE_SIZE, parseIssueQuery, toQueryString } from "@/lib/issue-query";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IssueRow } from "@/components/features/issues/issue-row";
import { IssueFilters } from "@/components/features/issues/issue-filters";
import { IssueListHeader } from "@/components/features/issues/issue-list-header";
import { Pagination } from "@/components/features/issues/pagination";
import { CreateIssueDialog } from "@/components/features/issues/create-issue-dialog";
import type { Project } from "@/types/project";
import type { Issue } from "@/types/issue";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; key: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug, key } = await params;
  const query = parseIssueQuery(await searchParams);

  const workspace = await getWorkspace(workspaceSlug);
  let project: Project;
  try {
    project = await apiFetch<Project>(`/v1/workspaces/${workspace.id}/projects/key/${key}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }

  const basePath = `/${workspaceSlug}/projects/${project.key}`;
  const { data: issues, meta } = await apiFetchPage<Issue[]>(
    `/v1/projects/${project._id}/issues${toQueryString(query, { limit: PAGE_SIZE })}`,
  );

  if (issues.length === 0 && meta.total > 0) {
    redirect(`${basePath}${toQueryString(query, { page: meta.totalPages })}`);
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || `Project key: ${project.key}`}
        actions={
          <>
            <ProjectViewNav basePath={basePath} />
            {can(workspace.role, "manageProjects") && (
              <Link
                href={`${basePath}/settings`}
                aria-label="Project settings"
                className={buttonVariants({ variant: "outline", size: "icon" })}
              >
                <Settings className="size-4" />
              </Link>
            )}
            {can(workspace.role, "editIssues") && (
              <CreateIssueDialog projectId={project._id} projectKey={project.key} shortcut />
            )}
          </>
        }
      />
      <Suspense>
        <IssueFilters projectId={project._id} />
      </Suspense>
      {issues.length === 0 ? (
        hasActiveFilters(query) ? (
          <EmptyState
            title="No issues match your filters"
            description="Try a different filter or search term"
            action={
              <Link href={basePath} className="text-sm text-primary hover:underline">
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState title="No issues yet" description="Create the first issue for this project" />
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <IssueListHeader query={query} basePath={basePath} />
            <div className="divide-y">
              {issues.map((issue) => (
                <IssueRow key={issue._id} issue={issue} projectKey={project.key} workspaceSlug={workspaceSlug} />
              ))}
            </div>
          </div>
          <Pagination meta={meta} query={query} basePath={basePath} />
        </>
      )}
    </div>
  );
}
