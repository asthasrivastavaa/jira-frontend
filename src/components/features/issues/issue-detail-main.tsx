"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { activityKey } from "@/lib/api/activity";
import { Button } from "@/components/ui/button";
import { useCan } from "@/components/layout/workspace-provider";
import { InlineText } from "./inline-text";
import { DeleteIssueDialog } from "./delete-issue-dialog";
import { updateIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import type { Issue } from "@/types/issue";

export function IssueDetailMain({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const router = useRouter();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const canEdit = useCan("editIssues");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const save = (field: "title" | "description") => async (value: string) => {
    const result = await updateIssue(issue._id, projectKey, issue.key, { [field]: value });
    if (!result.error) queryClient.invalidateQueries({ queryKey: activityKey(issue._id) }); // refresh History
    return result;
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
        {canEdit && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        )}
      </div>
      <InlineText
        value={issue.title}
        onSave={save("title")}
        required
        readOnly={!canEdit}
        className="text-xl font-semibold"
      />
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">Description</p>
        <InlineText
          value={issue.description ?? ""}
          onSave={save("description")}
          multiline
          readOnly={!canEdit}
          placeholder="Add a description..."
        />
      </div>
      <DeleteIssueDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        issueId={issue._id}
        issueKey={issue.key}
        projectKey={projectKey}
        onDeleted={() => router.push(`/${workspaceSlug}/projects/${projectKey}`)}
      />
    </div>
  );
}
