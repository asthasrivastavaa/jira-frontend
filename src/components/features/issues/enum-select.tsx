"use client";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OptionMeta } from "@/lib/issue-meta";

 export function OptionLabel({ meta }: { meta: OptionMeta }) {
  const Icon = meta.icon;
  return (
    <span className="flex items-center gap-2">
      {Icon && <Icon className={cn("size-4", meta.color)} />}
      {meta.dot && <span className={cn("size-2 rounded-full", meta.dot)} />}
      {meta.label}
    </span>
  );
}

 export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  meta,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  meta: Record<T, OptionMeta>;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{(v: T) => <OptionLabel meta={meta[v]} />}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            <OptionLabel meta={meta[o]} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
