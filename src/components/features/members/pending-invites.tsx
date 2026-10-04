"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api/client";
import { resendInvite, revokeInvite } from "@/lib/api/workspaces";
import type { PendingInvite } from "@/lib/api/workspaces";
import { cn } from "@/lib/utils";

export function PendingInvites({ invites, workspaceId }: { invites: PendingInvite[]; workspaceId: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  if (invites.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold">Pending invitations ({invites.length})</h2>
      <ul className="divide-y overflow-hidden rounded-lg border">
        {invites.map((inv) => {
          const expired = inv.status === "expired";
          return (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Mail className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="capitalize">{inv.role}</span> · {expired ? "Expired" : "Expires"}{" "}
                  {inv.expiresAt.slice(0, 10)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  expired ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                )}
              >
                {expired ? "Expired" : "Invited"}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === inv.id}
                  onClick={() => run(inv.id, () => resendInvite(workspaceId, inv.id), `Invitation sent again to ${inv.email}`)}
                >
                  <RotateCw /> Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === inv.id}
                  onClick={() => run(inv.id, () => revokeInvite(workspaceId, inv.id), "Invitation revoked")}
                >
                  <X /> Revoke
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
