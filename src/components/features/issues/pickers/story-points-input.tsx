"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Commits on blur or Enter (not on every keystroke), Esc reverts. Empty = no estimate (null). */
export function StoryPointsInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (points: number | null) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));

  function commit() {
    const trimmed = draft.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 0 || next > 100)) {
      setDraft(value === null ? "" : String(value)); // invalid -> revert
      return;
    }
    if (next !== value) onChange(next);
  }

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={100}
      placeholder="None"
      disabled={disabled}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") setDraft(value === null ? "" : String(value));
      }}
    />
  );
}
