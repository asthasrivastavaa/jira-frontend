"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { loginUser, resendOtp } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { formatTime, useCountdown } from "@/hooks/use-countdown";

import { saveOtpTimers } from "@/lib/auth-timers";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm({ verified, reset, next }: { verified?: boolean; reset?: boolean; next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const blockedLeft = useCountdown(blockedUntil);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await loginUser(values);
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          // correct password but unverified email: send a fresh code and continue verification
          const email = values.email.trim().toLowerCase();
          try {
            saveOtpTimers(email, await resendOtp({ email }));
          } catch {
            // a recent code may still be valid (cooldown); the OTP page handles that
            
          }
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }
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
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {verified && !formError && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4 shrink-0" /> Email verified. You can sign in now.
          </div>
        )}
        {reset && !verified && !formError && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4 shrink-0" /> Password updated. Sign in with your new password.
          </div>
        )}
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
            placeholder="you@company.com"
            className="h-10"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            className="h-10"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting || blockedLeft > 0}
        className="h-10 w-full text-sm font-medium">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
