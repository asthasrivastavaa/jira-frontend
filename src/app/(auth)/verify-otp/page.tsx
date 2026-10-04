import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OtpForm } from "@/components/features/auth/otp-form";

export const metadata: Metadata = { title: "Verify email · Jira Clone" };

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/register");
  return <OtpForm email={email} />;
}
