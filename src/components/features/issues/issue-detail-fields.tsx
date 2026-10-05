"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { activityKey } from "@/lib/api/activity";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { can } from "@/lib/permissions";
import { toDay } from "@/lib/dates";
import { EnumSelect } from "./enum-select";
import { AssigneePicker } from "./pickers/assignee-picker";
import { LabelPicker } from "./pickers/label-picker";
import { DueDatePicker } from "./pickers/due-date-picker";
import { StoryPointsInput } from "./pickers/story-points-input";
import { updateIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import type { UpdateIssueInput } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { epicsKey, fetchEpics } from "@/lib/api/hierarchy";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES, STANDARD_ISSUE_TYPES } from "@/types/issue";
import type { IssueParent } from "@/types/issue";
import { ISSUE_PRIORITY_META, ISSUE_STATUS_META, ISSUE_TYPE_META } from "@/lib/issue-meta";
import type { Issue } from "@/types/issue";

/**
 * The details panel. Every field saves on its own, optimistically:
 * show the new value now, send the PATCH, and put the old value back if the server says no.
 * The local state holds DISPLAY values (a user object, label objects); the PATCH sends ids.
 */
export function IssueDetailFields({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const canEdit = can(workspace.role, "editIssues");
  const [values, setValues] = useState({
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    assignee: issue.assigneeId,
    labels: issue.labelIds,
    storyPoints: issue.storyPoints,
    dueDate: issue.dueDate ? toDay(issue.dueDate) : null,
    epic: issue.type !== "subtask" ? (issue.parentId ?? null) : null,
  });
  type Values = typeof values;

  async function save<K extends keyof Values>(field: K, value: Values[K], input: UpdateIssueInput) {
    const previous = values[field];
    setValues((v) => ({ ...v, [field]: value }));
    const result = await updateIssue(issue._id, projectKey, issue.key, input);
    if (result.error) {
      setValues((v) => ({ ...v, [field]: previous }));
      toast.error(result.error);
      return;
    }
    // the History tab is client-cached: tell it a new entry exists
    queryClient.invalidateQueries({ queryKey: activityKey(issue._id) });
  }

  return (
    <div className="space-y-4">
      <Field label="Status">
        <EnumSelect
          disabled={!canEdit}
          value={values.status}
          onChange={(v) => save("status", v, { status: v })}
          options={ISSUE_STATUSES}
          meta={ISSUE_STATUS_META}
        />
      </Field>
      <Field label="Assignee">
        <AssigneePicker
          workspaceId={workspace.id}
          disabled={!canEdit}
          value={values.assignee}
          onChange={(user) => save("assignee", user, { assigneeId: user?._id ?? null })}
        />
      </Field>
      <Field label="Labels">
        <LabelPicker
          projectId={issue.projectId}
          disabled={!canEdit}
          value={values.labels}
          onChange={(labels) => save("labels", labels, { labelIds: labels.map((l) => l._id) })}
        />
      </Field>
      <Field label="Priority">
        <EnumSelect
          disabled={!canEdit}
          value={values.priority}
          onChange={(v) => save("priority", v, { priority: v })}
          options={ISSUE_PRIORITIES}
          meta={ISSUE_PRIORITY_META}
        />
      </Field>
      <Field label="Type">
        <EnumSelect
          // a sub-task stays a sub-task; other issues can't become one (it needs a parent task)
          disabled={!canEdit || values.type === "subtask"}
          value={values.type}
          onChange={(v) => save("type", v, { type: v })}
          options={values.type === "subtask" ? ISSUE_TYPES : STANDARD_ISSUE_TYPES}
          meta={ISSUE_TYPE_META}
        />
      </Field>
      {values.type !== "epic" && (
        <Field label={values.type === "subtask" ? "Parent" : "Epic"}>
          {values.type === "subtask" ? (
            <div className="flex h-8 items-center gap-2 px-2.5 text-sm">
              {issue.parentId && (
                <Link href={`/${workspace.slug}/projects/${projectKey}/issues/${issue.parentId.key}`} className="truncate hover:underline">
                  <span className="font-mono text-xs text-muted-foreground">{issue.parentId.key}</span> {issue.parentId.title}
                </Link>
              )}
            </div>
          ) : (
            <EpicPicker
              projectId={issue.projectId}
              disabled={!canEdit}
              value={values.epic}
              onChange={(epic) => save("epic", epic, { parentId: epic?._id ?? null })}
            />
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Story points">
          <StoryPointsInput
            disabled={!canEdit}
            value={values.storyPoints}
            onChange={(points) => save("storyPoints", points, { storyPoints: points })}
          />
        </Field>
        <Field label="Due date">
          <DueDatePicker
            disabled={!canEdit}
            done={values.status === "done"}
            value={values.dueDate}
            onChange={(day) => save("dueDate", day, { dueDate: day })}
          />
        </Field>
      </div>
      <Field label="Sprint">
        <div className="flex h-8 items-center gap-2 px-2.5 text-sm">
          {issue.sprintId ? (
            <>
              <span className="truncate">{issue.sprintId.name}</span>
              {issue.sprintId.status !== "planned" && (
                <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{issue.sprintId.status}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Backlog</span>
          )}
        </div>
      </Field>
      <Field label="Reporter">
        <div className="flex h-8 items-center gap-2 px-2.5 text-sm">
          {issue.reporterId ? (
            <>
              <UserAvatar user={issue.reporterId} size="sm" />
              <span className="truncate">{issue.reporterId.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </Field>
    </div>
  );
}

/** Pick the epic this task/story/bug belongs to. The list comes from GET /projects/:id/epics (with progress). */
function EpicPicker({
  projectId,
  value,
  onChange,
  disabled,
}: {
  projectId: string;
  value: { _id: string; key: string; title: string } | null;
  onChange: (epic: IssueParent | null) => void;
  disabled?: boolean;
}) {
  const { data: epics = [] } = useQuery({ queryKey: epicsKey(projectId), queryFn: () => fetchEpics(projectId) });
  return (
    <Select
      disabled={disabled}
      value={value?._id ?? "none"}
      onValueChange={(v) => {
        if (!v || v === (value?._id ?? "none")) return;
        const epic = epics.find((e) => e._id === v);
        onChange(epic ? { _id: epic._id, key: epic.key, title: epic.title, type: "epic", status: epic.status } : null);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {(v: string) =>
            v === "none" ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <span className="truncate">{value ? `${value.key} ${value.title}` : v}</span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {epics.map((e) => (
          <SelectItem key={e._id} value={e._id}>
            <span className="font-mono text-xs text-muted-foreground">{e.key}</span>
            <span className="truncate">{e.title}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {e.done}/{e.total}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
