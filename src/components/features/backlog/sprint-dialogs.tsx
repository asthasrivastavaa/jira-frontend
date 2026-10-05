"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fromLocalDate, toDay } from "@/lib/dates";
import type { Sprint } from "@/types/sprint";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

function inTwoWeeks() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return fromLocalDate(d);
}

/**
 * One dialog for "Start sprint" and "Edit sprint": name, goal, start and end day.
 * <input type="date"> already speaks "YYYY-MM-DD", exactly the format the API wants for calendar days.
 */
export function SprintFormDialog({
  mode,
  sprint,
  open,
  onOpenChange,
  onSubmit,
}: {
  mode: "start" | "edit";
  sprint: Sprint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; goal: string; startDate: string; endDate: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal);
  const [startDate, setStartDate] = useState(sprint.startDate ? toDay(sprint.startDate) : fromLocalDate(new Date()));
  const [endDate, setEndDate] = useState(sprint.endDate ? toDay(sprint.endDate) : inTwoWeeks());
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) return toast.error("The end date must be on or after the start date");
    setPending(true);
    try {
      await onSubmit({ name: name.trim() || sprint.name, goal, startDate, endDate });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "start" ? `Start ${sprint.name}` : `Edit ${sprint.name}`}</DialogTitle>
          {mode === "start" && (
            <DialogDescription>The board will show this sprint&apos;s issues until it&apos;s completed.</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="sprint-name">Name</Label>
            <Input id="sprint-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sprint-goal">Goal (optional)</Label>
            <Textarea id="sprint-goal" maxLength={500} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sprint-start">Start</Label>
              <Input id="sprint-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sprint-end">End</Label>
              <Input id="sprint-end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : mode === "start" ? "Start sprint" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Shows what's done vs. unfinished and asks where the unfinished issues should go. */
export function CompleteSprintDialog({
  sprint,
  doneCount,
  unfinishedCount,
  plannedSprints,
  open,
  onOpenChange,
  onComplete,
}: {
  sprint: Sprint;
  doneCount: number;
  unfinishedCount: number;
  plannedSprints: Sprint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (moveTo: string) => Promise<unknown>;
}) {
  const [moveTo, setMoveTo] = useState("backlog");
  const [pending, setPending] = useState(false);

  async function complete() {
    setPending(true);
    try {
      await onComplete(moveTo);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete {sprint.name}</DialogTitle>
          <DialogDescription>
            {doneCount} done · {unfinishedCount} unfinished
          </DialogDescription>
        </DialogHeader>
        {unfinishedCount > 0 ? (
          <div className="space-y-1">
            <Label>Move unfinished issues to</Label>
            <Select value={moveTo} onValueChange={(v) => v && setMoveTo(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => (v === "backlog" ? "Backlog" : (plannedSprints.find((s) => s._id === v)?.name ?? v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {plannedSprints.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Every issue in this sprint is done.</p>
        )}
        <DialogFooter>
          <Button onClick={complete} disabled={pending}>
            {pending ? "Completing..." : "Complete sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
