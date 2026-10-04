"use client";

import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteIssue } from "@/app/(app)/[workspaceSlug]/projects/[key]/actions";

export function DeleteIssueDialog({
  open,
  onOpenChange,
  issueId,
  issueKey,
  projectKey,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string;
  issueKey: string;
  projectKey: string;
  onDeleted?: () => void;
}) {
  async function onDelete() {
    const result = await deleteIssue(issueId, projectKey);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${issueKey} deleted`);
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {issueKey}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
