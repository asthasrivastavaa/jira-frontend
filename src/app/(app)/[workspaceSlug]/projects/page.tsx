import { apiFetch } from "@/lib/api/server";
import { getWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/features/projects/project-card";
import { CreateProjectDialog } from "@/components/features/projects/create-project-dialog";
import type { Project } from "@/types/project";

export default async function ProjectsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspace(workspaceSlug);
  const projects = await apiFetch<Project[]>(`/v1/workspaces/${workspace.id}/projects`);
  const canManage = can(workspace.role, "manageProjects");

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`All projects in ${workspace.name}`}
        actions={canManage ? <CreateProjectDialog workspaceId={workspace.id} /> : undefined}
      />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create your first project to get started" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} workspaceSlug={workspaceSlug} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
