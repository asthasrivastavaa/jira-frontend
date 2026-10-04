"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api/client";
import { createProjectInWorkspace } from "@/lib/api/projects";
import type { Workspace } from "@/lib/api/workspaces";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  key: z.string().regex(/^[A-Za-z]{2,10}$/, "Key must be 2-10 letters"),
});
type Values = z.infer<typeof schema>;

// "Customer Portal" -> "CP", "Billing" -> "BILL"
function suggestKey(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? "")).replace(/[^a-zA-Z]/g, "");
  return letters.slice(0, 4).toUpperCase();
}

export function ProjectStep({
  workspace,
  finishing,
  onFinish,
}: {
  workspace: Workspace;
  finishing: boolean;
  onFinish: () => void;
}) {
  const [keyTouched, setKeyTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", key: "" } });

  const name = watch("name");
  useEffect(() => {
    if (!keyTouched) setValue("key", suggestKey(name ?? ""), { shouldValidate: !!name });
  }, [name, keyTouched, setValue]);

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await createProjectInWorkspace(workspace.id, { name: values.name, key: values.key.toUpperCase() });
      onFinish();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 409) return setError("key", { message: err.message });
        return setFormError(err.message);
      }
      setFormError("Something went wrong. Please try again.");
    }
  }

  const busy = isSubmitting || finishing;

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FolderKanban className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Create your first project</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Projects hold your issues. The key becomes the prefix of every issue, like <span className="font-mono">PROJ-1</span>.
        </p>
      </div>

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
          <Label htmlFor="proj-name">Project name</Label>
          <Input id="proj-name" placeholder="Website redesign" autoFocus className="h-10" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proj-key">Key</Label>
          <Input
            id="proj-key"
            placeholder="WEB"
            autoComplete="off"
            className="h-10 font-mono uppercase"
            {...register("key", { onChange: () => setKeyTouched(true) })}
          />
          {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
        </div>
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Setting up…
            </>
          ) : (
            "Create project & finish"
          )}
        </Button>
        <Button type="button" variant="ghost" className="h-10 w-full" onClick={onFinish} disabled={busy}>
          Skip & finish
        </Button>
      </form>
    </div>
  );
}
