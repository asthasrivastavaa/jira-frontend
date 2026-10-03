"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { OptionLabel } from "./enum-select";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "@/types/issue";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import type { OptionMeta } from "@/lib/issue-meta";

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  meta,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | undefined) => void;
  options: readonly T[];
  meta: Record<T, OptionMeta>;
}) {
  return (
    <Select value={value ?? "all"} onValueChange={(v) => onChange(!v || v === "all" ? undefined : v)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue>
          {(v: string) => (v === "all" ? `All ${label}` : <OptionLabel meta={meta[v as T]} />)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            <OptionLabel meta={meta[o]} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function IssueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebounce(q, 300);

  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (debouncedQ.trim() === (searchParams.get("q") ?? "")) return;
    update({ q: debouncedQ.trim() || undefined });
  }, [debouncedQ, searchParams, update]);

  const status = searchParams.get("status");
  const active = ["status", "type", "priority", "q"].some((k) => searchParams.has(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => update({ status: undefined })}>
        All
      </Button>
      {ISSUE_STATUSES.map((s) => (
        <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => update({ status: s })}>
          {ISSUE_STATUS_META[s].label}
        </Button>
      ))}
      <FilterSelect
        label="types"
        value={searchParams.get("type")}
        onChange={(v) => update({ type: v })}
        options={ISSUE_TYPES}
        meta={ISSUE_TYPE_META}
      />
      <FilterSelect
        label="priorities"
        value={searchParams.get("priority")}
        onChange={(v) => update({ priority: v })}
        options={ISSUE_PRIORITIES}
        meta={ISSUE_PRIORITY_META}
      />
      <Input
        className="h-7 w-48"
        placeholder="Search issues..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {active && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
