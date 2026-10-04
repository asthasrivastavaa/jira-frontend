import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { InviteFlow } from "@/components/features/invite/invite-flow";
import { ApiRequestError } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/server";
import type { MeResponse } from "@/lib/api/auth";
import type { InvitePreview } from "@/lib/api/workspaces";

export const metadata: Metadata = { title: "Workspace invitation · Jira Clone" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let preview: InvitePreview;
  try {
    preview = await apiFetch<InvitePreview>(`/v1/invites/${encodeURIComponent(token)}`);
  } catch (err) {
    if (err instanceof ApiRequestError && [400, 404, 410].includes(err.statusCode)) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LinkIcon className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">This invitation can&apos;t be used</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            It has expired, was revoked, or was already accepted. Ask the person who invited you to send a new one.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        </div>
      );
    }
    throw err;
  }

  // logged in? (this page is public, so a 401 here just means "not signed in")
  let user: MeResponse["user"] | null = null;
  try {
    user = (await apiFetch<MeResponse>("/v1/auth/me")).user;
  } catch {
    user = null;
  }

  return <InviteFlow token={token} preview={preview} user={user} />;
}
