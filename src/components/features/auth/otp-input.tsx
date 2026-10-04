"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  hasError?: boolean;
}

export function OtpInput({ value, onChange, onComplete, hasError }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function update(next: string) {
    onChange(next);
    if (next.length === 6) onComplete?.(next);
    refs.current[Math.min(next.length, 5)]?.focus();
  }

  function handleChange(i: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    update((value.slice(0, i) + clean).slice(0, 6));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    update(text);
  }

  return (
    <div className={cn("flex w-full justify-center gap-2", hasError && "animate-shake")}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          maxLength={6}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 min-w-0 max-w-[3.25rem] flex-1 rounded-xl border bg-background text-center text-xl font-semibold tabular-nums outline-none transition",
            "focus:border-primary focus:ring-4 focus:ring-primary/20",
            digit && "border-primary/60 bg-primary/5",
            hasError &&
              "border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20",
          )}
        />
      ))}
    </div>
  );
}
