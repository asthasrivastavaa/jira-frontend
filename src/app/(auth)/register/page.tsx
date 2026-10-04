import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = { title: "Create account · Jira Clone" };

export default function RegisterPage() {
  return <RegisterForm />;
}
