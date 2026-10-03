"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InlineText } from "./inline-text";
import { DeleteIssueDialog } from "./delete-issue-dialog";
import { updateIssue } from "@/app/(app)/projects/[key]/actions";
import type { Issue } from "@/types/issue";

export function IssueDetailMain({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const save = (field: "title" | "description") => (value: string) =>
    updateIssue(issue._id, projectKey, issue.key, { [field]: value });

    const saveLabels = (value: string) =>
    updateIssue(issue._id, projectKey, issue.key, {
      labels: [...new Set(value.split(",").map((l) => l.trim()).filter(Boolean))],
    });

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>
      <InlineText value={issue.title} onSave={save("title")} required className="text-xl font-semibold" />
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">Description</p>
        <InlineText value={issue.description ?? ""} onSave={save("description")} multiline placeholder="Add a description..." />
        <p className="text-xs font-medium text-muted-foreground uppercase">Labels</p>
        <InlineText
          value={(issue.labels ?? []).join(", ")}
          onSave={saveLabels}
          placeholder="Add labels, comma separated..."
        />
      </div>
      <DeleteIssueDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        issueId={issue._id}
        issueKey={issue.key}
        projectKey={projectKey}
        onDeleted={() => router.push(`/projects/${projectKey}`)}
      />
    </div>
  );
}
