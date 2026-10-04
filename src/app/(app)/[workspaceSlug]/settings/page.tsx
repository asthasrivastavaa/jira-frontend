import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { WorkspaceDangerZone } from "@/components/features/settings/workspace-danger-zone";
import { WorkspaceGeneralForm } from "@/components/features/settings/workspace-general-form";
import { apiFetch } from "@/lib/api/server";
import { can } from "@/lib/permissions";
import { getWorkspace } from "@/lib/workspace";
import type { Member } from "@/lib/api/workspaces";

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspace(workspaceSlug);

  if (!can(workspace.role, "manageWorkspace")) {
    return (
      <EmptyState
        title="You don't have access to settings"
        description="Only admins and the owner can change workspace settings."
      />
    );
  }

  const isOwner = can(workspace.role, "ownerOnly");
  const admins = isOwner
    ? (await apiFetch<Member[]>(`/v1/workspaces/${workspace.id}/members`)).filter((m) => m.role === "admin")
    : [];

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Workspace settings" description={`Manage ${workspace.name}`} />
      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-sm font-semibold">General</h2>
        <WorkspaceGeneralForm workspace={workspace} />
      </section>
      {isOwner && <WorkspaceDangerZone workspace={workspace} admins={admins} />}
    </div>
  );
}
