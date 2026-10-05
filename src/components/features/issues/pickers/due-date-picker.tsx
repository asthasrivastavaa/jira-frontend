"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDay, fromLocalDate, isOverdue, toLocalDate } from "@/lib/dates";

/** value / onChange use "YYYY-MM-DD" strings, never Date objects (see lib/dates.ts for why). */
export function DueDatePicker({
  value,
  onChange,
  disabled,
  done = false,
}: {
  value: string | null;
  onChange: (day: string | null) => void;
  disabled?: boolean;
  /** a finished issue is never shown as overdue */
  done?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const overdue = value !== null && !done && isOverdue(value);

  const display = (
    <>
      <CalendarDays className="size-4 opacity-60" />
      <span className={cn(!value && "text-muted-foreground", overdue && "font-medium text-destructive")}>
        {value ? formatDay(value) : "None"}
      </span>
    </>
  );

  if (disabled) return <div className="flex h-8 items-center gap-2 px-2.5 text-sm">{display}</div>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-start gap-2 font-normal" />}>
        {display}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? toLocalDate(value) : undefined}
          defaultMonth={value ? toLocalDate(value) : undefined}
          onSelect={(date) => {
            setOpen(false);
            onChange(date ? fromLocalDate(date) : null);
          }}
        />
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                onChange(null);
              }}
            >
              Clear due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
