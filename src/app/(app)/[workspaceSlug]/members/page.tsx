import { apiFetch } from "@/lib/api/server";
import { getMe } from "@/lib/me";
import { getWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { InviteDialog } from "@/components/features/members/invite-dialog";
import { MembersTable } from "@/components/features/members/members-table";
import { PendingInvites } from "@/components/features/members/pending-invites";
import type { Member, PendingInvite } from "@/lib/api/workspaces";

export default async function MembersPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspace(workspaceSlug);
  const canManage = can(workspace.role, "manageMembers");

  const [me, members, invites] = await Promise.all([
    getMe(),
    apiFetch<Member[]>(`/v1/workspaces/${workspace.id}/members`),
    canManage ? apiFetch<PendingInvite[]>(`/v1/workspaces/${workspace.id}/invites`) : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.length} ${members.length === 1 ? "person" : "people"} in ${workspace.name}`}
        actions={canManage ? <InviteDialog workspaceId={workspace.id} /> : undefined}
      />
      <MembersTable
        members={members}
        workspaceId={workspace.id}
        currentUserId={me.user.id}
        myRole={workspace.role}
      />
      {canManage && <PendingInvites invites={invites} workspaceId={workspace.id} />}
    </div>
  );
}
