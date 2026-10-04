"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiRequestError } from "@/lib/api/client";
import { checkSlug, updateWorkspace } from "@/lib/api/workspaces";
import type { Workspace } from "@/lib/api/workspaces";
import { slugSchema, workspaceSchema, type WorkspaceValues } from "@/lib/validations/workspace";

type Availability = "idle" | "checking" | "available" | "unavailable";

export function WorkspaceGeneralForm({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability>("idle");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: workspace.name, slug: workspace.slug },
  });

  const name = watch("name");
  const slug = watch("slug");
  const debouncedSlug = useDebounce(slug, 400);
  const slugChanged = slug !== workspace.slug;
  const dirty = name !== workspace.name || slugChanged;

  // only check availability when the slug differs from the current one
  useEffect(() => {
    if (debouncedSlug === workspace.slug || !slugSchema.safeParse(debouncedSlug).success) {
      setAvailability("idle");
      return;
    }
    let cancelled = false;
    setAvailability("checking");
    checkSlug(debouncedSlug)
      .then((r) => !cancelled && setAvailability(r.available ? "available" : "unavailable"))
      .catch(() => !cancelled && setAvailability("idle"));
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, workspace.slug]);

  const status: Availability = slug === debouncedSlug ? availability : "checking";

  async function onSubmit(values: WorkspaceValues) {
    setFormError(null);
    const patch: { name?: string; slug?: string } = {};
    if (values.name !== workspace.name) patch.name = values.name;
    if (values.slug !== workspace.slug) patch.slug = values.slug;
    if (!patch.name && !patch.slug) return;

    try {
      const updated = await updateWorkspace(workspace.id, patch);
      toast.success("Workspace updated");
      reset({ name: updated.name, slug: updated.slug });
      // the slug is part of the URL: move to the new address
      if (updated.slug !== workspace.slug) router.push(`/${updated.slug}/settings`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 409) return setError("slug", { message: err.message });
        return setFormError(err.message);
      }
      setFormError("Something went wrong. Please try again.");
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
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input id="ws-name" className="h-10" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ws-slug">Workspace URL</Label>
        <div className="flex items-center overflow-hidden rounded-lg border bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20">
          <span className="select-none bg-muted px-3 py-2.5 text-sm text-muted-foreground">jiraclone.app/</span>
          <input
            id="ws-slug"
            autoComplete="off"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            {...register("slug")}
          />
        </div>
        <div className="min-h-4 text-xs">
          {errors.slug ? (
            <p className="text-destructive">{errors.slug.message}</p>
          ) : slugChanged && status === "checking" ? (
            <p className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Checking…
            </p>
          ) : slugChanged && status === "available" ? (
            <p className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-3" /> Available
            </p>
          ) : slugChanged && status === "unavailable" ? (
            <p className="flex items-center gap-1 text-destructive">
              <XCircle className="size-3" /> Taken or reserved. Try another.
            </p>
          ) : null}
        </div>
        {slugChanged && (
          <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Changing the URL changes every link to this workspace. Old links, including bookmarks, will stop working.
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !dirty || status === "unavailable" || (slugChanged && status === "checking")}
      >
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
