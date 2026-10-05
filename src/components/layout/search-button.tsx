"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "./command-palette";

/** Looks like a search box, opens the command palette (same thing Ctrl/Cmd+K does). */
export function SearchButton() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-8 w-full max-w-64 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground hover:bg-muted"
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded border bg-background px-1.5 font-mono text-[10px]">Ctrl K</kbd>
    </button>
  );
}
