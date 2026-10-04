"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace } from "@/lib/api/workspaces";

export function WorkspaceSwitcher({ current, workspaces }: { current: Workspace; workspaces: Workspace[] }) {
  const router = useRouter();

  useEffect(() => {
    document.cookie = `last_workspace=${current.slug}; path=/; max-age=31536000; samesite=lax`;
  }, [current.slug]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md p-1.5 text-left outline-none transition hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          />
        }
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          {current.name[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
          {current.name}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onClick={() => router.push(`/${w.slug}/projects`)}>
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
              {w.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{w.name}</span>
            <span className="text-xs capitalize text-muted-foreground">{w.role}</span>
            {w.id === current.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          <Plus className="size-4" /> Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
