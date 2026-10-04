"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clock, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTime, useCountdown } from "@/hooks/use-countdown";
import { forgotPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { saveOtpTimers } from "@/lib/auth-timers";
import { forgotSchema, type ForgotValues } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const blockedLeft = useCountdown(blockedUntil);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setFormError(null);
    const email = values.email.trim().toLowerCase();
    try {
      // the server answers identically whether or not the account exists
      saveOtpTimers(email, await forgotPassword({ email }), "reset");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 429) {
          setBlockedUntil(Date.now() + (err.retryAfter ?? 60) * 1000);
          return;
        }
        setFormError(err.message);
        return;
      }
      setFormError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and, if an account exists, we&apos;ll send you a 6-digit code to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {blockedLeft > 0 && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          >
            <Clock className="size-4 shrink-0" />
            Too many attempts. You can try again in{" "}
            <span className="font-mono font-medium tabular-nums">{formatTime(blockedLeft)}</span>
          </div>
        )}
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            className="h-10"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting || blockedLeft > 0} className="h-10 w-full text-sm font-medium">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Sending…
            </>
          ) : blockedLeft > 0 ? (
            `Try again in ${formatTime(blockedLeft)}`
          ) : (
            "Send code"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>
      </p>
    </>
  );
}
