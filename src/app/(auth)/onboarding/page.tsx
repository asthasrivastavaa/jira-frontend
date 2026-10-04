import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/features/onboarding/onboarding-flow";
import { apiFetch } from "@/lib/api/server";
import type { MeResponse } from "@/lib/api/auth";

export const metadata: Metadata = { title: "Set up your workspace · Jira Clone" };

export default async function OnboardingPage() {
  const { workspaces } = await apiFetch<MeResponse>("/v1/auth/me");
  const pending = workspaces.find((w) => w.role === "owner" && !w.onboardingCompleted) ?? null;
  return <OnboardingFlow initialWorkspace={pending} />;
}
