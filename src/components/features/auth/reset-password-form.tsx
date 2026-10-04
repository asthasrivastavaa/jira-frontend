"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Clock, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "./otp-input";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { formatTime, useCountdown } from "@/hooks/use-countdown";
import { forgotPassword, resetPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { loadOtpTimers, saveOtpTimers } from "@/lib/auth-timers";
import { resetSchema, type ResetValues } from "@/lib/validations/auth";

type Timers = { resendAt: number | null; expiresAt: number | null };

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [timers, setTimers] = useState<Timers>({ resendAt: null, expiresAt: null });
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadOtpTimers(email, "reset");
    if (saved) setTimers(saved);
    setReady(true);
  }, [email]);

  const resendLeft = useCountdown(timers.resendAt);
  const expiresLeft = useCountdown(timers.expiresAt);
  const blockedLeft = useCountdown(blockedUntil);
  const expired = ready && timers.expiresAt !== null && expiresLeft === 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "" },
  });
  const newPassword = watch("newPassword");

  async function onSubmit(values: ResetValues) {
    setFormError(null);
    setCodeError(null);
    if (code.length !== 6) {
      setCodeError("Enter the 6-digit code from your email");
      return;
    }
    try {
      await resetPassword({ email, code, newPassword: values.newPassword });
      toast.success("Password updated");
      router.push("/login?reset=1");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 429) {
          setBlockedUntil(Date.now() + (err.retryAfter ?? 60) * 1000);
          return;
        }
        if (/code|attempt|expired/i.test(err.message)) {
          setCodeError(err.message);
          setCode("");
          setResetKey((k) => k + 1);
          return;
        }
        setFormError(err.message);
        return;
      }
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function handleResend() {
    setResending(true);
    setCodeError(null);
    try {
      const res = await forgotPassword({ email });
      saveOtpTimers(email, res, "reset");
      setTimers({
        resendAt: Date.now() + res.resendIn * 1000,
        expiresAt: Date.now() + res.expiresIn * 1000,
      });
      setCode("");
      setResetKey((k) => k + 1);
      toast.success("If the account exists, a new code is on its way");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const secs = err.message.match(/(\d+)s/);
        if (secs) setTimers((t) => ({ ...t, resendAt: Date.now() + Number(secs[1]) * 1000 }));
        toast.error(err.message);
      } else {
        toast.error("Could not resend the code");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter the 6-digit code we sent to
          <br />
          <span className="break-all font-medium text-foreground">{email}</span>
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

        <div className="space-y-2">
          <Label>Verification code</Label>
          <OtpInput
            key={resetKey}
            value={code}
            onChange={(v) => {
              setCode(v);
              setCodeError(null);
            }}
            hasError={!!codeError}
          />
          {codeError && (
            <p role="alert" className="text-center text-xs text-destructive">
              {codeError}
            </p>
          )}
          <div className="min-h-4 text-center text-xs text-muted-foreground">
            {ready &&
              (expired ? (
                <span className="font-medium text-destructive">Code expired. Request a new one.</span>
              ) : (
                timers.expiresAt && (
                  <>
                    Code expires in{" "}
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatTime(expiresLeft)}
                    </span>
                  </>
                )
              ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-10"
            {...register("newPassword")}
          />
          <PasswordStrength password={newPassword} />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || blockedLeft > 0 || expired || code.length !== 6}
          className="h-10 w-full text-sm font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Updating…
            </>
          ) : (
            "Reset password"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {resendLeft > 0 ? (
            <>
              Resend code in{" "}
              <span className="font-mono font-medium tabular-nums text-foreground">{formatTime(resendLeft)}</span>
            </>
          ) : (
            <>
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>
      </p>
    </>
  );
}
