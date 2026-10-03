"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EnumSelect } from "./enum-select";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

import { createIssue } from "@/app/(app)/projects/[key]/actions";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "@/types/issue";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";


const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(ISSUE_TYPES),
  status: z.enum(ISSUE_STATUSES),
  priority: z.enum(ISSUE_PRIORITIES),
    labels: z
    .string()
    .transform((s) => [...new Set(s.split(",").map((l) => l.trim()).filter(Boolean))])
       .pipe(
      z
        .array(z.string())
        .max(10, "At most 10 labels")
        .refine((arr) => arr.every((l) => l.length <= 30), "Each label max 30 characters"),
    ),

});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;



export function CreateIssueDialog({ projectId, projectKey }: { projectId: string; projectKey: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
   } = useForm<FormInput, unknown, FormValues>({

    resolver: zodResolver(schema),
        defaultValues: { title: "", description: "", type: "task", status: "todo", priority: "medium", labels: "" },

  });

  async function onSubmit(values: FormValues) {
    const result = await createIssue(projectId, projectKey, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Issue created");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Create issue</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description (optional)</Label>
                      <div className="space-y-1">
            <Label htmlFor="labels">Labels (comma separated)</Label>
            <Input id="labels" placeholder="backend, urgent" {...register("labels")} />
            {errors.labels && <p className="text-sm text-destructive">{errors.labels.message}</p>}
          </div>

            <Textarea id="description" {...register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <EnumSelect value={field.value} onChange={field.onChange} options={ISSUE_TYPES} meta={ISSUE_TYPE_META} />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <EnumSelect value={field.value} onChange={field.onChange} options={ISSUE_PRIORITIES} meta={ISSUE_PRIORITY_META} />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <EnumSelect value={field.value} onChange={field.onChange} options={ISSUE_STATUSES} meta={ISSUE_STATUS_META} />
                )}
              />
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
