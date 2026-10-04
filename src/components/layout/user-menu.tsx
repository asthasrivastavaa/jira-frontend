"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import { ChangeEmailDialog } from "./change-email-dialog";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [emailOpen, setEmailOpen] = useState(false);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // still send the user to the login page
    }
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        {initials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setEmailOpen(true)}>
          <Mail className="size-4" /> Change email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ChangeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} currentEmail={user.email} />
    </>
  );
}
