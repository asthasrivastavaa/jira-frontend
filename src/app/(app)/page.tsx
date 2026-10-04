import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import type { MeResponse } from "@/lib/api/auth";

export default async function Home() {
  const { workspaces } = await apiFetch<MeResponse>("/v1/auth/me");
  const needsOnboarding =
    workspaces.length === 0 || workspaces.every((w) => w.role === "owner" && !w.onboardingCompleted);
  if (needsOnboarding) redirect("/onboarding");

  const last = (await cookies()).get("last_workspace")?.value;
  const ready = workspaces.filter((w) => w.onboardingCompleted);
  const target = ready.find((w) => w.slug === last) ?? ready[0] ?? workspaces[0];
  redirect(`/${target.slug}/projects`);
}
