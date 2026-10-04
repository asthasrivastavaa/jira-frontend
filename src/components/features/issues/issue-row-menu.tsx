"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCan } from "@/components/layout/workspace-provider";
import { DeleteIssueDialog } from "./delete-issue-dialog";
import type { Issue } from "@/types/issue";

export function IssueRowMenu({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const router = useRouter();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const canEdit = useCan("editIssues");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // viewers can still open the issue by clicking the row; they get no actions menu
  if (!canEdit) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${issue.key}`} />}>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => router.push(`/${workspaceSlug}/projects/${projectKey}/issues/${issue.key}`)}>
            Open
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteIssueDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        issueId={issue._id}
        issueKey={issue.key}
        projectKey={projectKey}
      />
    </>
  );
}
