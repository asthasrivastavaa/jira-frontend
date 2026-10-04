"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function InlineText({
  value,
  onSave,
  multiline = false,
  required = false,
  placeholder,
  className,
  readOnly = false,
}: {
  value: string;
  onSave: (value: string) => Promise<{ error?: string }>;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}) {
  const [shown, setShown] = useState(value);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  async function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next === shown) return;
    if (required && !next) {
      setDraft(shown);
      toast.error("This field can't be empty");
      return;
    }
    const previous = shown;
    setShown(next);
    const result = await onSave(next);
    if (result.error) {
      setShown(previous);
      setDraft(previous);
      toast.error(result.error);
    }
  }

  function cancel() {
    setDraft(shown);
    setEditing(false);
  }

  // viewers can read but not edit
  if (readOnly) {
    return (
      <div className={cn("w-full py-1 whitespace-pre-wrap", !shown && "text-muted-foreground", className)}>
        {shown || "—"}
      </div>
    );
  }

  if (editing && multiline) {
    return (
      <Textarea
        autoFocus
        rows={6}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
        }}
      />
    );
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter") commit();
        }}
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(shown);
        setEditing(true);
      }}
      className={cn(
        "-mx-2 w-full rounded-md px-2 py-1 text-left whitespace-pre-wrap hover:bg-muted",
        !shown && "text-muted-foreground",
        className,
      )}
    >
      {shown || placeholder}
    </button>
  );
}
