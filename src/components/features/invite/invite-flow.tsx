"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/features/auth/password-input";
import { PasswordStrength } from "@/components/features/auth/password-strength";
import { ApiRequestError } from "@/lib/api/client";
import { logoutUser } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import { acceptInvite, registerWithInvite } from "@/lib/api/workspaces";
import type { InvitePreview } from "@/lib/api/workspaces";
import { inviteRegisterSchema, type InviteRegisterValues } from "@/lib/validations/auth";

function Header({ preview }: { preview: InvitePreview }) {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="size-6" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Join {preview.workspaceName}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        You&apos;ve been invited as <span className="font-medium capitalize text-foreground">{preview.role}</span>
      </p>
    </div>
  );
}

export function InviteFlow({
  token,
  preview,
  user,
}: {
  token: string;
  preview: InvitePreview;
  user: AuthUser | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteRegisterValues>({
    resolver: zodResolver(inviteRegisterSchema),
    defaultValues: { name: "", password: "" },
  });
  const password = watch("password");

  function goTo(slug: string) {
    router.push(`/${slug}/projects`);
    router.refresh();
  }

  async function onAccept() {
    setError(null);
    setAccepting(true);
    try {
      const workspace = await acceptInvite(token);
      toast.success(`Welcome to ${workspace.name}`);
      goTo(workspace.slug);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  async function onRegister(values: InviteRegisterValues) {
    setError(null);
    try {
      const { workspace } = await registerWithInvite({ token, ...values });
      toast.success(`Welcome to ${workspace.name}`);
      goTo(workspace.slug);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function onSwitchAccount() {
    try {
      await logoutUser();
    } catch {
      // the page re-render below shows the logged-out state either way
    }
    router.refresh();
  }

  const errorBox = error && (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error}
    </div>
  );

  // 1. logged in as the invited email -> one click
  if (user && user.email === preview.email) {
    return (
      <>
        <Header preview={preview} />
        {errorBox}
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Joining as <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <Button className="h-10 w-full" onClick={onAccept} disabled={accepting}>
          {accepting ? (
            <>
              <Loader2 className="animate-spin" /> Joining…
            </>
          ) : (
            `Join ${preview.workspaceName}`
          )}
        </Button>
      </>
    );
  }

  // 2. logged in as somebody else -> must switch accounts
  if (user) {
    return (
      <>
        <Header preview={preview} />
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-400">
          This invitation was sent to <span className="font-medium">{preview.email}</span>, but you&apos;re signed in as{" "}
          <span className="font-medium">{user.email}</span>.
        </div>
        <Button variant="outline" className="mt-4 h-10 w-full" onClick={onSwitchAccount}>
          Sign out and continue
        </Button>
      </>
    );
  }

  // 3. not logged in, but the invited email already has an account -> log in first
  if (preview.hasAccount) {
    return (
      <>
        <Header preview={preview} />
        <p className="mb-4 text-center text-sm text-muted-foreground">
          An account already exists for <span className="font-medium text-foreground">{preview.email}</span>. Sign in to
          accept the invitation.
        </p>
        <Link
          href={loginHref}
          className="flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Sign in to join
        </Link>
      </>
    );
  }

  // 4. no account yet -> create one right here (the invite proves the email, so no OTP)
  return (
    <>
      <Header preview={preview} />
      {errorBox}
      <form onSubmit={handleSubmit(onRegister)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" value={preview.email} readOnly disabled className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name">Full name</Label>
          <Input id="invite-name" autoComplete="name" autoFocus className="h-10" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-password">Password</Label>
          <PasswordInput
            id="invite-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-10"
            {...register("password")}
          />
          <PasswordStrength password={password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Creating account…
            </>
          ) : (
            `Create account & join`
          )}
        </Button>
      </form>
    </>
  );
}
