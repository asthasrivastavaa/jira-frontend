"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseEmails } from "@/components/features/members/invite-dialog";
import { ApiRequestError } from "@/lib/api/client";
import { inviteMembers } from "@/lib/api/workspaces";
import type { InviteRole, Workspace } from "@/lib/api/workspaces";

export function InviteStep({ workspace, onDone }: { workspace: Workspace; onDone: () => void }) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setError(null);
    const emails = parseEmails(text);
    if (emails.length === 0) return setError("Enter at least one email address, or skip this step");
    if (emails.length > 20) return setError("You can invite up to 20 people at a time");
    const bad = emails.find((m) => !z.email().safeParse(m).success);
    if (bad) return setError(`"${bad}" is not a valid email address`);

    setLoading(true);
    try {
      const results = await inviteMembers(workspace.id, { emails, role });
      const sent = results.filter((r) => r.status !== "already_member").length;
      toast.success(`${sent} invitation${sent === 1 ? "" : "s"} sent`);
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Invite your teammates</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{workspace.name}</span> is ready. Add the people you work with.
          You can always do this later from the Members page.
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="onb-emails">Email addresses</Label>
          <Textarea
            id="onb-emails"
            rows={3}
            placeholder="alex@company.com, sam@company.com"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onb-role">Role</Label>
          <select
            id="onb-role"
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <Button className="h-10 w-full" onClick={send} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Sending…
            </>
          ) : (
            "Send invitations"
          )}
        </Button>
        <Button variant="ghost" className="h-10 w-full" onClick={onDone} disabled={loading}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
