"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { registerUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { saveOtpTimers } from "@/lib/auth-timers";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const password = watch("password");

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const res = await registerUser(values);
      saveOtpTimers(res.email, res);
      router.push(`/verify-otp?email=${encodeURIComponent(res.email)}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 409) {
          setError("email", { message: err.message });
          return;
        }
        if (err.statusCode === 429) {
          router.push(`/verify-otp?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
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
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start planning work with your team in minutes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="your email" className="h-10" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
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
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-10"
            {...register("password")}
          />
          <PasswordStrength password={password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-10 w-full text-sm font-medium">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
