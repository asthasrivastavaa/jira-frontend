"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteIssueDialog } from "./delete-issue-dialog";
import type { Issue } from "@/types/issue";

export function IssueRowMenu({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${issue.key}`} />}>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => router.push(`/projects/${projectKey}/issues/${issue.key}`)}>
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
