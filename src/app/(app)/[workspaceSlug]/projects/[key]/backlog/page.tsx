import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import { ApiRequestError } from "@/lib/api/client";
import { getWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { CreateIssueDialog } from "@/components/features/issues/create-issue-dialog";
import { ProjectViewNav } from "@/components/features/projects/project-view-nav";
import { Backlog } from "@/components/features/backlog/backlog";
import type { Project } from "@/types/project";
import type { BacklogData } from "@/types/sprint";

export default async function BacklogPage({ params }: { params: Promise<{ workspaceSlug: string; key: string }> }) {
  const { workspaceSlug, key } = await params;
  const workspace = await getWorkspace(workspaceSlug);

  let project: Project;
  try {
    project = await apiFetch<Project>(`/v1/workspaces/${workspace.id}/projects/key/${key}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
  const backlog = await apiFetch<BacklogData>(`/v1/projects/${project._id}/backlog`);
  const basePath = `/${workspaceSlug}/projects/${project.key}`;

  return (
    <div>
      <PageHeader
        title={`${project.name} backlog`}
        description="Plan sprints by dragging issues between the sprints and the backlog."
        actions={
          <>
            <ProjectViewNav basePath={basePath} />
            {can(workspace.role, "editIssues") && <CreateIssueDialog projectId={project._id} projectKey={project.key} shortcut />}
          </>
        }
      />
      <Backlog projectId={project._id} projectKey={project.key} workspaceSlug={workspaceSlug} initial={backlog} />
    </div>
  );
}
