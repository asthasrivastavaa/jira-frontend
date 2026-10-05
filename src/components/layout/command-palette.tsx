"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useCan, useWorkspace } from "@/components/layout/workspace-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { listProjects, projectsKey, searchKey, searchWorkspace } from "@/lib/api/search";
import { ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import { canUseSingleKeyShortcut, requestCreateIssue } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

const PaletteContext = createContext<{ open: () => void } | null>(null);

/** `const { open } = useCommandPalette()`: e.g. the topbar search box. */
export function useCommandPalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

/**
 * Mounted once in the workspace layout. Owns the global shortcuts:
 *   Ctrl/Cmd+K  open / close the palette (works even while typing: it has a modifier)
 *   c           create an issue on the current project page
 * Every listener added in useEffect is removed in its cleanup; without that, each re-mount would
 * add another listener and one key press would fire several times.
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const canCreate = useCan("editIssues");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); // the browser's own Ctrl+K (focus the address bar search)
        setOpen((o) => !o);
        return;
      }
      if (e.key === "c" && canCreate && canUseSingleKeyShortcut(e)) {
        if (requestCreateIssue()) e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canCreate]);

  const openPalette = useCallback(() => setOpen(true), []);

  return (
    <PaletteContext.Provider value={{ open: openPalette }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to an issue or project">
        {/* the dialog content only mounts while open, so the search state resets every time */}
        {open && <PaletteContent onClose={() => setOpen(false)} />}
      </CommandDialog>
    </PaletteContext.Provider>
  );
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const workspace = useWorkspace();
  const canCreate = useCan("editIssues");
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 200);

  const projects = useQuery({ queryKey: projectsKey(workspace.id), queryFn: () => listProjects(workspace.id) });
  const results = useQuery({
    queryKey: searchKey(workspace.id, q),
    queryFn: () => searchWorkspace(workspace.id, q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData, // keep the old results on screen while the next ones load (no flicker)
  });

  const base = `/${workspace.slug}`;
  const onProjectPage = /\/projects\/[^/]+/.test(pathname);
  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const searching = query.trim().length > 0;
  const issues = searching ? (results.data?.issues ?? []) : [];
  const projectHits = searching ? (results.data?.projects ?? []) : (projects.data ?? []).slice(0, 6);

  return (
    // shouldFilter={false}: the SERVER filters (text index); cmdk must not filter the results again
    <Command shouldFilter={false}>
      <CommandInput placeholder="Search issues and projects..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{results.isFetching ? "Searching..." : "No results."}</CommandEmpty>

        {issues.length > 0 && (
          <CommandGroup heading="Issues">
            {issues.map((issue) => {
              const type = ISSUE_TYPE_META[issue.type];
              const Icon = type.icon!;
              return (
                <CommandItem
                  key={issue._id}
                  value={issue._id}
                  onSelect={() => go(`${base}/projects/${issue.projectKey}/issues/${issue.key}`)}
                >
                  <Icon className={cn(type.color)} />
                  <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{issue.key}</span>
                  <span className="truncate">{issue.title}</span>
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs", ISSUE_STATUS_META[issue.status].badge)}>
                    {ISSUE_STATUS_META[issue.status].label}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {projectHits.length > 0 && (
          <CommandGroup heading="Projects">
            {projectHits.map((p) => (
              <CommandItem key={p._id} value={`project:${p._id}`} onSelect={() => go(`${base}/projects/${p.key}`)}>
                <FolderKanban />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{p.key}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!searching && (
          <CommandGroup heading="Actions">
            {canCreate && onProjectPage && (
              <CommandItem
                value="action:create"
                onSelect={() => {
                  onClose();
                  // wait for the palette to close, otherwise its "a dialog is open" state blocks the next one
                  setTimeout(() => {
                    if (!requestCreateIssue()) toast.error("Open a project to create an issue");
                  }, 50);
                }}
              >
                <Plus />
                Create issue
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem value="action:projects" onSelect={() => go(`${base}/projects`)}>
              <FolderKanban />
              All projects
            </CommandItem>
            <CommandItem value="action:members" onSelect={() => go(`${base}/members`)}>
              <Users />
              Members
            </CommandItem>
            <CommandItem value="action:settings" onSelect={() => go(`${base}/settings`)}>
              <Settings />
              Workspace settings
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
