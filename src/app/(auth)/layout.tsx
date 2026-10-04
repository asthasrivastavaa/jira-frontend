import Link from "next/link";
import { ModeToggle } from "@/components/shared/mode-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted/40 px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/10"
      />
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>

      <Link href="/" className="relative mb-6 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/30">
          J
        </span>
        <span className="text-lg font-semibold tracking-tight">Jira Clone</span>
      </Link>

      <div className="relative w-full max-w-[400px] rounded-2xl border bg-card p-8 text-card-foreground shadow-xl shadow-black/5">
        {children}
      </div>

      <p className="relative mt-6 text-xs text-muted-foreground">
        Secure sign-in · Your password is never stored in plain text
      </p>
    </div>
  );
}
