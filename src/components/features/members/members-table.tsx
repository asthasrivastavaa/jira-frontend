"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiRequestError } from "@/lib/api/client";
import { changeMemberRole, removeMember } from "@/lib/api/workspaces";
import type { InviteRole, Member, WorkspaceRole } from "@/lib/api/workspaces";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ASSIGNABLE: InviteRole[] = ["admin", "member", "viewer"];

const ROLE_STYLE: Record<WorkspaceRole, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
  viewer: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

export function MembersTable({
  members,
  workspaceId,
  currentUserId,
  myRole,
}: {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
  myRole: WorkspaceRole;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<Member | null>(null);
  const canManage = can(myRole, "manageMembers");

  async function onRoleChange(member: Member, role: InviteRole) {
    setBusyId(member.userId);
    try {
      await changeMemberRole(workspaceId, member.userId, role);
      toast.success(`${member.name} is now ${role}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not change the role");
    } finally {
      setBusyId(null);
    }
  }

  async function onConfirmRemove() {
    if (!target) return;
    const leaving = target.userId === currentUserId;
    setBusyId(target.userId);
    try {
      await removeMember(workspaceId, target.userId);
      toast.success(leaving ? "You left the workspace" : `${target.name} was removed`);
      setTarget(null);
      if (leaving) {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not remove the member");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <div className="hidden grid-cols-[1fr_9rem_6rem] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase text-muted-foreground sm:grid">
          <span>Member</span>
          <span>Role</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y">
          {members.map((m) => {
            const isSelf = m.userId === currentUserId;
            const editable = canManage && m.role !== "owner" && !isSelf;
            const busy = busyId === m.userId;
            return (
              <li key={m.userId} className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_9rem_6rem] sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.name}
                      {isSelf && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>

                <div>
                  {editable ? (
                    <select
                      aria-label={`Role for ${m.name}`}
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => onRoleChange(m, e.target.value as InviteRole)}
                      className="h-8 w-full rounded-md border bg-background px-2 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", ROLE_STYLE[m.role])}>
                      {m.role}
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  {editable && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${m.name}`}
                      disabled={busy}
                      onClick={() => setTarget(m)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                  {isSelf && m.role !== "owner" && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => setTarget(m)}>
                      <LogOut /> Leave
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target?.userId === currentUserId ? "Leave this workspace?" : `Remove ${target?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target?.userId === currentUserId
                ? "You will lose access to its projects and issues until someone invites you again."
                : "They will lose access to this workspace's projects and issues. You can invite them again later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRemove}>
              {target?.userId === currentUserId ? "Leave" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
