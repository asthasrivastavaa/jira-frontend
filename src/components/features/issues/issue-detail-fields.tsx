"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useCan } from "@/components/layout/workspace-provider";
import { EnumSelect } from "./enum-select";
import { updateIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import type { UpdateIssueInput } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "@/types/issue";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import type { Issue } from "@/types/issue";

export function IssueDetailFields({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const canEdit = useCan("editIssues");
  const [values, setValues] = useState({ status: issue.status, priority: issue.priority, type: issue.type });

  async function save<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    const previous = values[field];
    setValues((v) => ({ ...v, [field]: value }));
    const result = await updateIssue(issue._id, projectKey, issue.key, { [field]: value } as UpdateIssueInput);
    if (result.error) {
      setValues((v) => ({ ...v, [field]: previous }));
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Status</Label>
        <EnumSelect disabled={!canEdit} value={values.status} onChange={(v) => save("status", v)} options={ISSUE_STATUSES} meta={ISSUE_STATUS_META} />
      </div>
      <div className="space-y-1">
        <Label>Priority</Label>
        <EnumSelect disabled={!canEdit} value={values.priority} onChange={(v) => save("priority", v)} options={ISSUE_PRIORITIES} meta={ISSUE_PRIORITY_META} />
      </div>
      <div className="space-y-1">
        <Label>Type</Label>
        <EnumSelect disabled={!canEdit} value={values.type} onChange={(v) => save("type", v)} options={ISSUE_TYPES} meta={ISSUE_TYPE_META} />
      </div>
    </div>
  );
}
