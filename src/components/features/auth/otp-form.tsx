"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./otp-input";
import { formatTime, useCountdown } from "@/hooks/use-countdown";
import { resendOtp, verifyOtp } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { loadOtpTimers, saveOtpTimers } from "@/lib/auth-timers";

type Timers = { resendAt: number | null; expiresAt: number | null };

export function OtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [timers, setTimers] = useState<Timers>({ resendAt: null, expiresAt: null });

  useEffect(() => {
    const saved = loadOtpTimers(email);
    if (saved) setTimers(saved);
    setReady(true);
  }, [email]);

  const resendLeft = useCountdown(timers.resendAt);
  const expiresLeft = useCountdown(timers.expiresAt);
  const expired = ready && timers.expiresAt !== null && expiresLeft === 0;

  async function submit(value: string) {
    if (loading || expired) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp({ email, code: value });
      toast.success("Email verified. Welcome aboard!");
      router.push("/");
      router.refresh();

    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setCode("");
      setResetKey((k) => k + 1);
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      const res = await resendOtp({ email });
      saveOtpTimers(email, res);
      setTimers({
        resendAt: Date.now() + res.resendIn * 1000,
        expiresAt: Date.now() + res.expiresIn * 1000,
      });
      setCode("");
      setResetKey((k) => k + 1);
      toast.success("A new code is on its way");
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
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a 6-digit code to
          <br />
          <span className="break-all font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <OtpInput
          key={resetKey}
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(null);
          }}
          onComplete={submit}
          hasError={!!error}
        />

        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="min-h-5 text-center text-sm text-muted-foreground">
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

        <Button
          className="h-10 w-full text-sm font-medium"
          disabled={code.length !== 6 || loading || expired}
          onClick={() => submit(code)}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Verifying…
            </>
          ) : (
            "Verify email"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {resendLeft > 0 ? (
            <>
              Resend code in{" "}
              <span className="font-mono font-medium tabular-nums text-foreground">
                {formatTime(resendLeft)}
              </span>
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
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Start over
        </Link>
      </p>
    </>
  );
}
