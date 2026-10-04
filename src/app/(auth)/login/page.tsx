import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in · Jira Clone" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string; next?: string }>;
}) {
  const { verified, reset, next } = await searchParams;
  return <LoginForm verified={verified === "1"} reset={reset === "1"} next={next} />;
}
