"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TypedConfirmDialog } from "@/components/shared/typed-confirm-dialog";
import { ApiRequestError } from "@/lib/api/client";
import { deleteProjectById, updateProjectSettings } from "@/lib/api/projects";
import type { Member } from "@/lib/api/workspaces";
import type { Project } from "@/types/project";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(500, "At most 500 characters").optional(),
  leadId: z.string(),
});
type Values = z.infer<typeof schema>;

export function ProjectGeneralForm({ project, members }: { project: Project; members: Member[] }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: project.name, description: project.description ?? "", leadId: project.leadId ?? "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await updateProjectSettings(project._id, {
        name: values.name,
        description: values.description ?? "",
        leadId: values.leadId || null,
      });
      toast.success("Project updated");
      reset(values);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="p-key">Key</Label>
        <Input id="p-key" value={project.key} readOnly disabled className="h-10 w-40 font-mono" />
        <p className="text-xs text-muted-foreground">
          The key can&apos;t be changed: every issue key (like {project.key}-1) is built from it.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" className="h-10" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" rows={3} {...register("description")} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-lead">Project lead</Label>
        <select
          id="p-lead"
          className="h-10 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("leadId")}
        >
          <option value="">No lead</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}

export function ProjectDangerZone({ project, workspaceSlug }: { project: Project; workspaceSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onDelete() {
    try {
      await deleteProjectById(project._id);
      toast.success("Project deleted");
      setOpen(false);
      router.push(`/${workspaceSlug}/projects`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not delete the project");
    }
  }

  return (
    <section className="rounded-lg border border-destructive/40">
      <div className="border-b border-destructive/40 bg-destructive/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="max-w-md">
          <p className="text-sm font-medium">Delete this project</p>
          <p className="text-xs text-muted-foreground">
            Permanently deletes the project and every issue in it. This cannot be undone.
          </p>
        </div>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete project
        </Button>
      </div>
      <TypedConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${project.name}?`}
        description="The project and all of its issues will be deleted permanently."
        confirmText={project.key}
        actionLabel="Delete project"
        onConfirm={onDelete}
      />
    </section>
  );
}
