import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password · Jira Clone" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/forgot-password");
  return <ResetPasswordForm email={email} />;
}
