"use client";

import { useEffect, useState } from "react";
import { CREATE_ISSUE_EVENT } from "@/lib/shortcuts";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { EnumSelect } from "./enum-select";
import { AssigneePicker } from "./pickers/assignee-picker";
import { LabelPicker } from "./pickers/label-picker";
import { DueDatePicker } from "./pickers/due-date-picker";
import { StoryPointsInput } from "./pickers/story-points-input";
import { createIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES, STANDARD_ISSUE_TYPES } from "@/types/issue";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import type { Label as IssueLabel, UserSummary } from "@/types/issue";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(ISSUE_TYPES),
  status: z.enum(ISSUE_STATUSES),
  priority: z.enum(ISSUE_PRIORITIES),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { title: "", description: "", type: "task", status: "todo", priority: "medium" };

/**
 * Text fields go through react-hook-form + zod. The pickers hold OBJECTS (a user, label documents)
 * so they can show names and colors; they live in plain state and are turned into ids on submit.
 */
export function CreateIssueDialog({
  projectId,
  projectKey,
  defaults,
  triggerLabel = "Create issue",
  triggerVariant = "default",
  onCreated,
  shortcut = false,
}: {
  projectId: string;
  projectKey: string;
  /** e.g. the board's active sprint (so the new card shows up on the board), or a parent for a sub-task */
  defaults?: { sprintId?: string | null; parentId?: string; type?: FormValues["type"] };
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  /** e.g. refresh a client-cached child list after creating a sub-task */
  onCreated?: () => void;
  /** the page's main "Create issue" button: opens on the `c` key / the palette's "Create issue" */
  shortcut?: boolean;
}) {
  // a sub-task can only be created from its parent, so it's only offered when the parent set it as the default
  const typeOptions = defaults?.type === "subtask" ? (["subtask"] as const) : STANDARD_ISSUE_TYPES;
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState<UserSummary | null>(null);
  const [labels, setLabels] = useState<IssueLabel[]>([]);
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULTS, type: defaults?.type ?? DEFAULTS.type },
  });

  // answer "create issue" requests from the `c` key and the command palette (see lib/shortcuts.ts)
  useEffect(() => {
    if (!shortcut) return;
    const onRequest = (e: Event) => {
      e.preventDefault(); // tells the sender "handled"
      setOpen(true);
    };
    window.addEventListener(CREATE_ISSUE_EVENT, onRequest);
    return () => window.removeEventListener(CREATE_ISSUE_EVENT, onRequest);
  }, [shortcut]);

  function resetAll() {
    reset({ ...DEFAULTS, type: defaults?.type ?? DEFAULTS.type });
    setAssignee(null);
    setLabels([]);
    setStoryPoints(null);
    setDueDate(null);
  }

  async function onSubmit(values: FormValues) {
    const result = await createIssue(projectId, projectKey, {
      ...values,
      assigneeId: assignee?._id ?? null,
      labelIds: labels.map((l) => l._id),
      storyPoints,
      dueDate,
      ...(defaults?.sprintId !== undefined && { sprintId: defaults.sprintId }),
      ...(defaults?.parentId && { parentId: defaults.parentId }),
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Issue created");
    setOpen(false);
    resetAll();
    onCreated?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger render={<Button variant={triggerVariant} />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <EnumSelect value={field.value} onChange={field.onChange} options={typeOptions} meta={ISSUE_TYPE_META} />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ISSUE_PRIORITIES}
                    meta={ISSUE_PRIORITY_META}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ISSUE_STATUSES}
                    meta={ISSUE_STATUS_META}
                  />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Assignee</Label>
              <AssigneePicker workspaceId={workspace.id} value={assignee} onChange={setAssignee} />
            </div>
            <div className="space-y-1">
              <Label>Labels</Label>
              <LabelPicker projectId={projectId} value={labels} onChange={setLabels} />
            </div>
            <div className="space-y-1">
              <Label>Story points</Label>
              <StoryPointsInput key={open ? "open" : "closed"} value={storyPoints} onChange={setStoryPoints} />
            </div>
            <div className="space-y-1">
              <Label>Due date</Label>
              <DueDatePicker value={dueDate} onChange={setDueDate} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
