import Link from "next/link";
import { toQueryString } from "@/lib/issue-query";
import type { IssueQuery } from "@/lib/issue-query";
import type { PageMeta } from "@/lib/api/client";

export function Pagination({ meta, query, basePath }: { meta: PageMeta; query: IssueQuery; basePath: string }) {
  const href = (page: number) => `${basePath}${toQueryString(query, { page })}`;
  const on = "rounded-md border px-3 py-1 text-sm hover:bg-muted";
  const off = "rounded-md border px-3 py-1 text-sm opacity-40";

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {meta.total} {meta.total === 1 ? "issue" : "issues"} · page {meta.page} of {Math.max(meta.totalPages, 1)}
      </span>
      <div className="flex gap-2">
        {meta.page > 1 ? <Link href={href(meta.page - 1)} className={on}>Previous</Link> : <span className={off}>Previous</span>}
        {meta.page < meta.totalPages ? <Link href={href(meta.page + 1)} className={on}>Next</Link> : <span className={off}>Next</span>}
      </div>
    </div>
  );
}
