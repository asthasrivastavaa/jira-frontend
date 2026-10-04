"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiRequestError } from "@/lib/api/client";
import { checkSlug, completeOnboarding, createWorkspace, type Workspace } from "@/lib/api/workspaces";
import { slugify, slugSchema, workspaceSchema, type WorkspaceValues } from "@/lib/validations/workspace";
import { cn } from "@/lib/utils";
import { InviteStep } from "./invite-step";
import { ProjectStep } from "./project-step";

const STEP_LABELS = ["Workspace", "Teammates", "First project"];
type Availability = "idle" | "checking" | "available" | "unavailable";

export function OnboardingFlow({ initialWorkspace }: { initialWorkspace: Workspace | null }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialWorkspace ? 2 : 1);
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace);
  const [finishing, setFinishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>("idle");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  const name = watch("name");
  const slug = watch("slug");
  const debouncedSlug = useDebounce(slug, 400);

  // slug follows the name until the user edits it by hand
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(name ?? ""), { shouldValidate: !!name });
  }, [name, slugTouched, setValue]);

  // live availability check (ignores stale responses)
  useEffect(() => {
    if (!slugSchema.safeParse(debouncedSlug).success) {
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
  }, [debouncedSlug]);

  const slugIsCurrent = slug === debouncedSlug;
  const status: Availability = slugIsCurrent ? availability : "checking";

  async function onSubmit(values: WorkspaceValues) {
    setFormError(null);
    try {
      const ws = await createWorkspace(values);
      setWorkspace(ws);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 409) {
          setError("slug", { message: err.message });
          setAvailability("unavailable");
          return;
        }
        setFormError(err.message);
        return;
      }
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function finish() {
    if (!workspace) return;
    setFinishing(true);
    try {
      await completeOnboarding(workspace.id);
    } catch {
      toast.error("Could not finish setup. Please try again.");
      setFinishing(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <ol className="mb-2 flex items-center justify-center gap-2" aria-label="Setup progress">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done || current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : n}
              </span>
              {n < 3 && <span className={cn("h-px w-8 transition-colors", step > n ? "bg-primary" : "bg-border")} />}
            </li>
          );
        })}
      </ol>
      <p className="mb-6 text-center text-xs text-muted-foreground">
        Step {step} of 3 · {STEP_LABELS[step - 1]}
      </p>

      {step === 1 && (
        <>
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Create your workspace</h1>
            <p className="text-sm text-muted-foreground">
              A workspace is where your team&apos;s projects and issues live.
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
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input id="ws-name" placeholder="Acme Inc" autoFocus className="h-10" {...register("name")} />
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
                  placeholder="acme-inc"
                  className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                  {...register("slug", { onChange: () => setSlugTouched(true) })}
                />
              </div>
              <div className="min-h-4 text-xs">
                {errors.slug ? (
                  <p className="text-destructive">{errors.slug.message}</p>
                ) : slug && status === "checking" ? (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Checking…
                  </p>
                ) : status === "available" ? (
                  <p className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-3" /> Available
                  </p>
                ) : status === "unavailable" ? (
                  <p className="flex items-center gap-1 text-destructive">
                    <XCircle className="size-3" /> Taken or reserved. Try another.
                  </p>
                ) : null}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || status === "unavailable" || status === "checking"}
              className="h-10 w-full text-sm font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Creating…
                </>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        </>
      )}

      {step === 2 && workspace && <InviteStep workspace={workspace} onDone={() => setStep(3)} />}

      {step === 3 && workspace && <ProjectStep workspace={workspace} finishing={finishing} onFinish={finish} />}
    </>
  );
}
