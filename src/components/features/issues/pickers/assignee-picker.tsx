"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useMembers } from "@/hooks/use-project-data";
import type { UserSummary } from "@/types/issue";

/**
 * A combobox = a button that opens a searchable list (Popover + cmdk Command).
 * cmdk gives us the accessibility for free: the input owns focus, arrow keys move the highlighted
 * option (aria-activedescendant), Enter selects, Esc closes, and typing filters.
 */
export function AssigneePicker({
  workspaceId,
  value,
  onChange,
  disabled,
}: {
  workspaceId: string;
  value: UserSummary | null;
  onChange: (user: UserSummary | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [], isLoading } = useMembers(workspaceId);
  // viewers are read-only, so they can't be assigned work (the API enforces the same rule)
  const assignable = members.filter((m) => m.role !== "viewer");

  const display = (
    <>
      <UserAvatar user={value} size="sm" />
      <span className="truncate">{value?.name ?? "Unassigned"}</span>
    </>
  );

  if (disabled) return <div className="flex h-8 items-center gap-2 px-2.5 text-sm">{display}</div>;

  function pick(user: UserSummary | null) {
    setOpen(false);
    if ((user?._id ?? null) !== (value?._id ?? null)) onChange(user);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-start gap-2 font-normal" />}>
        {display}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No one found"}</CommandEmpty>
            <CommandGroup>
              <CommandItem value="unassigned" data-checked={!value} onSelect={() => pick(null)}>
                <UserAvatar user={null} size="sm" />
                Unassigned
              </CommandItem>
              {assignable.map((m) => (
                <CommandItem
                  key={m.userId}
                  // cmdk filters on `value`: name + email, so both are searchable
                  value={`${m.name} ${m.email}`}
                  data-checked={value?._id === m.userId}
                  onSelect={() => pick({ _id: m.userId, name: m.name, email: m.email })}
                >
                  <UserAvatar user={{ _id: m.userId, name: m.name }} size="sm" />
                  <span className="truncate">{m.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
