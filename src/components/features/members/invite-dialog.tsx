"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiRequestError } from "@/lib/api/client";
import { inviteMembers } from "@/lib/api/workspaces";
import type { InviteRole } from "@/lib/api/workspaces";

const ROLES: { value: InviteRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Manage members, projects and settings" },
  { value: "member", label: "Member", hint: "Create and edit issues" },
  { value: "viewer", label: "Viewer", hint: "Read-only access" },
];

// "a@x.com, b@x.com  c@x.com" -> unique, lowercase list
export function parseEmails(text: string) {
  return [...new Set(text.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export function InviteDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setText("");
    setRole("member");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emails = parseEmails(text);
    if (emails.length === 0) return setError("Enter at least one email address");
    if (emails.length > 20) return setError("You can invite up to 20 people at a time");
    const bad = emails.find((m) => !z.email().safeParse(m).success);
    if (bad) return setError(`"${bad}" is not a valid email address`);

    setLoading(true);
    try {
      const results = await inviteMembers(workspaceId, { emails, role });
      const sent = results.filter((r) => r.status !== "already_member").length;
      const skipped = results.length - sent;
      toast.success(
        `${sent} invitation${sent === 1 ? "" : "s"} sent` + (skipped ? `, ${skipped} already in the workspace` : ""),
      );
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus /> Invite people
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to your workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="invite-emails">Email addresses</Label>
            <Textarea
              id="invite-emails"
              rows={3}
              placeholder="alex@company.com, sam@company.com"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate addresses with commas, spaces or new lines.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as InviteRole)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.hint}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Sending…
                </>
              ) : (
                "Send invitations"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
