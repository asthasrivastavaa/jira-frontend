"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KanbanSquare, List, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

/** List | Board | Backlog: the three views of one project. The current one is highlighted. */
export function ProjectViewNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const views = [
    { href: basePath, label: "List", icon: List },
    { href: `${basePath}/board`, label: "Board", icon: KanbanSquare },
    { href: `${basePath}/backlog`, label: "Backlog", icon: Rows3 },
  ];
  return (
    <nav aria-label="Project views" className="inline-flex rounded-lg border p-0.5">
      {views.map(({ href, label, icon: Icon }) => {
        const current = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground",
              current && "bg-muted font-medium text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
