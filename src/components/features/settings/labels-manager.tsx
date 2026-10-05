"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InlineText } from "@/components/features/issues/inline-text";
import { LabelPill } from "@/components/features/labels/label-pill";
import { useLabels } from "@/hooks/use-project-data";
import { LABEL_COLORS, createLabel, deleteLabel, labelsKey, updateLabel } from "@/lib/api/labels";
import { cn } from "@/lib/utils";
import type { Label } from "@/types/issue";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

/**
 * Label CRUD for one project. Every change writes the result into the shared ["labels", projectId] cache,
 * so pickers elsewhere on the page are up to date without a refetch.
 * Renaming or recoloring a label changes it on every issue at once — that's the point of a labels collection.
 */
export function LabelsManager({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const key = labelsKey(projectId);
  const { data: labels = [], isLoading } = useLabels(projectId);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LABEL_COLORS[5]);

  const setLabels = (fn: (old: Label[]) => Label[]) =>
    queryClient.setQueryData<Label[]>(key, (old = []) => fn(old).sort((a, b) => a.name.localeCompare(b.name)));

  const create = useMutation({
    mutationFn: () => createLabel(projectId, { name: name.trim(), color }),
    onSuccess: (label) => {
      setLabels((old) => [...old, label]);
      setName("");
      toast.success(`Label "${label.name}" created`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (label: Label) => deleteLabel(projectId, label._id),
    onSuccess: (_res, label) => {
      setLabels((old) => old.filter((l) => l._id !== label._id));
      toast.success(`Label "${label.name}" deleted and removed from its issues`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  async function patch(label: Label, body: { name?: string; color?: string }) {
    try {
      const updated = await updateLabel(projectId, label._id, body);
      setLabels((old) => old.map((l) => (l._id === updated._id ? updated : l)));
      return {};
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <ColorPicker value={color} onChange={setColor} />
        <Input
          placeholder="New label name"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!name.trim() || create.isPending}>
          Add
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : labels.length === 0 ? (
        <p className="text-sm text-muted-foreground">No labels yet. Labels can also be created from any issue.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {labels.map((label) => (
            <li key={label._id} className="flex items-center gap-3 px-3 py-2">
              <ColorPicker
                value={label.color}
                onChange={async (c) => {
                  const result = await patch(label, { color: c });
                  if (result.error) toast.error(result.error);
                }}
              />
              <div className="min-w-0 flex-1">
                <InlineText value={label.name} required onSave={(n) => patch(label, { name: n })} />
              </div>
              <LabelPill label={label} className="hidden sm:inline-flex" />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete label ${label.name}`}
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`Delete "${label.name}"? It will be removed from every issue that has it.`)) {
                    remove.mutate(label);
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" aria-label="Label color" className="size-6 shrink-0 rounded-full border" />}
        style={{ backgroundColor: value }}
      />
      <PopoverContent className="w-auto" align="start">
        <div className="grid grid-cols-5 gap-2">
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={c === value}
              onClick={() => {
                setOpen(false);
                if (c !== value) onChange(c);
              }}
              className={cn("size-6 rounded-full", c === value && "ring-2 ring-offset-2 ring-offset-background")}
              style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
