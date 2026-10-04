"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OtpInput } from "@/components/features/auth/otp-input";
import { PasswordInput } from "@/components/features/auth/password-input";
import { formatTime, useCountdown } from "@/hooks/use-countdown";
import { confirmEmailChange, requestEmailChange } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { changeEmailSchema, type ChangeEmailValues } from "@/lib/validations/auth";

/** Two steps: (1) new address + current password, (2) the 6-digit code that was sent to the NEW address. */
export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const resendLeft = useCountdown(resendAt);
  const expiresLeft = useCountdown(expiresAt);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", password: "" },
  });

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setStep("form");
      setCode("");
      setError(null);
      setResendAt(null);
      setExpiresAt(null);
      reset();
    }
  }

  function startTimers(t: { resendIn: number; expiresIn: number }) {
    setResendAt(Date.now() + t.resendIn * 1000);
    setExpiresAt(Date.now() + t.expiresIn * 1000);
  }

  async function onRequest(values: ChangeEmailValues) {
    setError(null);
    try {
      const res = await requestEmailChange(values);
      setNewEmail(res.email);
      startTimers(res);
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function onResend() {
    setError(null);
    try {
      startTimers(await requestEmailChange(getValues()));
      setCode("");
      setResetKey((k) => k + 1);
      toast.success("A new code was sent");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not resend the code");
    }
  }

  async function onConfirm() {
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await confirmEmailChange({ code });
      toast.success("Email updated");
      close(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
      setCode("");
      setResetKey((k) => k + 1);
    } finally {
      setVerifying(false);
    }
  }

  const expired = step === "code" && expiresAt !== null && expiresLeft === 0;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change your email</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleSubmit(onRequest)} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              Your current email is <span className="font-medium text-foreground">{currentEmail}</span>. We&apos;ll send a
              6-digit code to the new address to confirm it&apos;s yours.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ce-email">New email</Label>
              <Input id="ce-email" type="email" autoComplete="email" className="h-10" {...register("newEmail")} />
              {errors.newEmail && <p className="text-xs text-destructive">{errors.newEmail.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce-password">Current password</Label>
              <PasswordInput
                id="ce-password"
                autoComplete="current-password"
                className="h-10"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Sending code…
                </>
              ) : (
                "Send code"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent to <span className="break-all font-medium text-foreground">{newEmail}</span>.
            </p>
            <OtpInput key={resetKey} value={code} onChange={setCode} onComplete={() => {}} hasError={!!error} />
            <div className="min-h-4 text-center text-xs text-muted-foreground">
              {expired ? (
                <span className="font-medium text-destructive">Code expired. Request a new one.</span>
              ) : (
                <>
                  Code expires in{" "}
                  <span className="font-mono font-medium tabular-nums text-foreground">{formatTime(expiresLeft)}</span>
                </>
              )}
            </div>
            <Button className="h-10 w-full" onClick={onConfirm} disabled={code.length !== 6 || verifying || expired}>
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" /> Confirming…
                </>
              ) : (
                "Confirm new email"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {resendLeft > 0 ? (
                <>
                  Resend code in{" "}
                  <span className="font-mono font-medium tabular-nums text-foreground">{formatTime(resendLeft)}</span>
                </>
              ) : (
                <button type="button" onClick={onResend} className="font-medium text-primary hover:underline">
                  Resend code
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
                setCode("");
              }}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
