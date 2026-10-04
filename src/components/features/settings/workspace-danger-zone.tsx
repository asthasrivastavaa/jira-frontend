"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { TypedConfirmDialog } from "@/components/shared/typed-confirm-dialog";
import { ApiRequestError } from "@/lib/api/client";
import { deleteWorkspace, transferOwnership } from "@/lib/api/workspaces";
import type { Member, Workspace } from "@/lib/api/workspaces";

export function WorkspaceDangerZone({ workspace, admins }: { workspace: Workspace; admins: Member[] }) {
  const router = useRouter();
  const [newOwnerId, setNewOwnerId] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const newOwner = admins.find((a) => a.userId === newOwnerId);

  async function onTransfer() {
    try {
      await transferOwnership(workspace.id, newOwnerId);
      toast.success(`${newOwner?.name ?? "The new owner"} now owns this workspace`);
      setTransferOpen(false);
      router.refresh(); // your role is now "admin", so this page re-renders without the danger zone
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not transfer ownership");
    }
  }

  async function onDelete() {
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace deleted");
      setDeleteOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete the workspace");
    }
  }

  return (
    <section className="rounded-lg border border-destructive/40">
      <div className="border-b border-destructive/40 bg-destructive/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        <p className="text-xs text-muted-foreground">Only the owner can see and use these.</p>
      </div>

      <div className="divide-y">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="max-w-md">
            <p className="text-sm font-medium">Transfer ownership</p>
            <p className="text-xs text-muted-foreground">
              Hand this workspace to an admin. You become an admin. Only admins can receive it, so promote someone from
              the Members page first.
            </p>
          </div>
          {admins.length === 0 ? (
            <span className="text-xs text-muted-foreground">No admins yet</span>
          ) : (
            <div className="flex items-center gap-2">
              <select
                aria-label="New owner"
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose an admin…</option>
                {admins.map((a) => (
                  <option key={a.userId} value={a.userId}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
              <Button variant="outline" disabled={!newOwnerId} onClick={() => setTransferOpen(true)}>
                Transfer
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="max-w-md">
            <p className="text-sm font-medium">Delete this workspace</p>
            <p className="text-xs text-muted-foreground">
              Permanently deletes the workspace with all its projects, issues, members and invitations. This cannot be
              undone.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete workspace
          </Button>
        </div>
      </div>

      <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership to {newOwner?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will become the owner and can delete the workspace. You will become an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onTransfer}>Transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TypedConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this workspace?"
        description="Every project, issue, member and invitation inside it will be deleted permanently."
        confirmText={workspace.name}
        actionLabel="Delete workspace"
        onConfirm={onDelete}
      />
    </section>
  );
}
