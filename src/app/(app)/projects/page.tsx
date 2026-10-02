import { apiFetch } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/features/projects/project-card";
import { CreateProjectDialog } from "@/components/features/projects/create-project-dialog";
import type { Project } from "@/types/project";

export default async function ProjectsPage() {
  const projects = await apiFetch<Project[]>("/v1/projects");

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All projects in your workspace"
        actions={<CreateProjectDialog />}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
