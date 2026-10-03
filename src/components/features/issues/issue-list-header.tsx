import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toQueryString } from "@/lib/issue-query";
import type { IssueQuery } from "@/lib/issue-query";

function SortLink({
  field,
  label,
  query,
  basePath,
  className,
}: {
  field: "number" | "title";
  label: string;
  query: IssueQuery;
  basePath: string;
  className?: string;
}) {
  const asc = query.sort === field;
  const desc = query.sort === `-${field}`;
  const next = asc ? `-${field}` : field;
  return (
    <Link
      href={`${basePath}${toQueryString(query, { sort: next, page: 1 })}`}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", className)}
    >
      {label}
      {asc && <ArrowUp className="size-3" />}
      {desc && <ArrowDown className="size-3" />}
    </Link>
  );
}

export function IssueListHeader({ query, basePath }: { query: IssueQuery; basePath: string }) {
  return (
    <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
      <span className="w-4 shrink-0" />
      <SortLink field="number" label="Key" query={query} basePath={basePath} className="w-20 shrink-0" />
      <SortLink field="title" label="Title" query={query} basePath={basePath} className="flex-1" />
      <span className="w-7 shrink-0" />
      <span className="w-24 shrink-0 text-center">Status</span>
    </div>
  );
}
