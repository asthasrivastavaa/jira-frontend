"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LabelPill } from "@/components/features/labels/label-pill";
import { useLabels } from "@/hooks/use-project-data";
import { LABEL_COLORS, createLabel, labelsKey } from "@/lib/api/labels";
import type { Label } from "@/types/issue";

const MAX_LABELS = 10;

/**
 * Multi-select: the popover stays open while you toggle labels.
 * Typing a name that doesn't exist offers "Create label" — the new label is added to the shared
 * labels cache (so every other picker on the page sees it) and selected immediately.
 */
export function LabelPicker({
  projectId,
  value,
  onChange,
  disabled,
}: {
  projectId: string;
  value: Label[];
  onChange: (labels: Label[]) => void;
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: labels = [], isLoading } = useLabels(projectId);

  const selectedIds = new Set(value.map((l) => l._id));
  const name = search.trim();
  const exists = labels.some((l) => l.name.toLowerCase() === name.toLowerCase());

  const create = useMutation({
    mutationFn: () => createLabel(projectId, { name, color: LABEL_COLORS[labels.length % LABEL_COLORS.length] }),
    onSuccess: (label) => {
      queryClient.setQueryData<Label[]>(labelsKey(projectId), (old = []) =>
        [...old, label].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSearch("");
      onChange([...value, label]);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create the label"),
  });

  function toggle(label: Label) {
    if (selectedIds.has(label._id)) onChange(value.filter((l) => l._id !== label._id));
    else if (value.length >= MAX_LABELS) toast.error(`At most ${MAX_LABELS} labels`);
    else onChange([...value, label]);
  }

  const display = value.length ? (
    <span className="flex flex-wrap gap-1">
      {value.map((l) => (
        <LabelPill key={l._id} label={l} />
      ))}
    </span>
  ) : (
    <span className="text-muted-foreground">None</span>
  );

  if (disabled) return <div className="flex min-h-8 items-center px-2.5 text-sm">{display}</div>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="h-auto min-h-8 w-full justify-start py-1 font-normal" />}
      >
        {display}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or create..." value={search} onValueChange={setSearch} maxLength={30} />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No labels yet"}</CommandEmpty>
            <CommandGroup>
              {labels.map((label) => (
                <CommandItem
                  key={label._id}
                  value={label.name}
                  data-checked={selectedIds.has(label._id)}
                  onSelect={() => toggle(label)}
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {name && !exists && (
              <CommandGroup forceMount>
                <CommandItem
                  forceMount
                  value={`create:${name}`}
                  disabled={create.isPending}
                  onSelect={() => create.mutate()}
                >
                  <Plus />
                  Create label &ldquo;{name}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
