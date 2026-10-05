import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  ProjectDangerZone,
  ProjectGeneralForm,
} from "@/components/features/settings/project-settings-forms";
import { LabelsManager } from "@/components/features/settings/labels-manager";
import { ApiRequestError } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/server";
import { can } from "@/lib/permissions";
import { getWorkspace } from "@/lib/workspace";
import type { Member } from "@/lib/api/workspaces";
import type { Project } from "@/types/project";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; key: string }>;
}) {
  const { workspaceSlug, key } = await params;
  const workspace = await getWorkspace(workspaceSlug);

  if (!can(workspace.role, "manageProjects")) {
    return (
      <EmptyState
        title="You don't have access to project settings"
        description="Only admins and the owner can change project settings."
      />
    );
  }

  let project: Project;
  try {
    project = await apiFetch<Project>(`/v1/workspaces/${workspace.id}/projects/key/${key}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
  const members = await apiFetch<Member[]>(`/v1/workspaces/${workspace.id}/members`);

  return (
    <div className="max-w-2xl space-y-8">
      <Link
        href={`/${workspaceSlug}/projects/${project.key}`}
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← {project.name}
      </Link>
      <PageHeader title="Project settings" description={`${project.name} (${project.key})`} />

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-sm font-semibold">General</h2>
        <ProjectGeneralForm project={project} members={members} />
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="text-sm font-semibold">Labels</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Renaming or recoloring a label updates every issue that has it. Deleting one removes it from those issues.
        </p>
        <LabelsManager projectId={project._id} />
      </section>

      <ProjectDangerZone project={project} workspaceSlug={workspaceSlug} />
    </div>
  );
}
