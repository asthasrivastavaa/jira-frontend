import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { ProjectViewNav } from "@/components/features/projects/project-view-nav";
import { formatDay, toDay } from "@/lib/dates";
import type { Sprint } from "@/types/sprint";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/server";
import { ApiRequestError } from "@/lib/api/client";
import { boardQueryString } from "@/lib/api/board";
import { getWorkspace } from "@/lib/workspace";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { CreateIssueDialog } from "@/components/features/issues/create-issue-dialog";
import { Board } from "@/components/features/board/board";
import type { Project } from "@/types/project";
import type { Board as BoardData } from "@/types/issue";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; key: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug, key } = await params;
  // the filter lives in the URL, so it survives a refresh and can be shared as a link
  const mine = (await searchParams).assignee === "me";
  const workspace = await getWorkspace(workspaceSlug);

  let project: Project;
  try {
    project = await apiFetch<Project>(`/v1/workspaces/${workspace.id}/projects/key/${key}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) notFound();
    throw err;
  }
  const [board, sprints] = await Promise.all([
    apiFetch<BoardData>(`/v1/projects/${project._id}/board${boardQueryString({ mine })}`),
    apiFetch<Sprint[]>(`/v1/projects/${project._id}/sprints`),
  ]);
  // with an active sprint the API returns only its issues (Scrum); without one, every issue (Kanban)
  const activeSprint = sprints.find((s) => s.status === "active") ?? null;
  const basePath = `/${workspaceSlug}/projects/${project.key}`;

  return (
    <div>
      <PageHeader
        title={activeSprint ? activeSprint.name : `${project.name} board`}
        description={
          activeSprint
            ? [
                activeSprint.endDate && `Ends ${formatDay(toDay(activeSprint.endDate))}`,
                activeSprint.goal,
              ]
                .filter(Boolean)
                .join(" · ") || `${project.name} · active sprint`
            : `${project.name} · no active sprint, showing every issue`
        }
        actions={
          <>
            <ProjectViewNav basePath={basePath} />
            {can(workspace.role, "editIssues") && (
              // new cards join the active sprint, otherwise they'd vanish from the board they were created on
              <CreateIssueDialog
                projectId={project._id}
                projectKey={project.key}
                defaults={activeSprint ? { sprintId: activeSprint._id } : undefined}
                shortcut
              />
            )}
          </>
        }
      />
      <div className="mb-4 flex items-center gap-3">
        {!activeSprint && (
          <Link href={`${basePath}/backlog`} className="text-sm text-muted-foreground hover:text-foreground">
            Plan and start a sprint in the backlog →
          </Link>
        )}
        <Link
          href={mine ? `${basePath}/board` : `${basePath}/board?assignee=me`}
          aria-pressed={mine}
          className={buttonVariants({ variant: mine ? "default" : "outline", size: "sm" })}
        >
          <UserRound className="size-4" /> My issues
        </Link>
      </div>
      <Board
        projectId={project._id}
        projectKey={project.key}
        workspaceSlug={workspaceSlug}
        initialBoard={board}
        mine={mine}
      />
    </div>
  );
}
