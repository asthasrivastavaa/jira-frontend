import { Bookmark, Bug, ChevronDown, ChevronUp, Equal, ListTree, SquareCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IssuePriority, IssueStatus, IssueType } from "@/types/issue";

export type OptionMeta = { label: string; icon?: LucideIcon; color?: string; dot?: string };

export const ISSUE_TYPE_META: Record<IssueType, OptionMeta> = {
  task: { label: "Task", icon: SquareCheck, color: "text-blue-500" },
  bug: { label: "Bug", icon: Bug, color: "text-red-500" },
  story: { label: "Story", icon: Bookmark, color: "text-green-500" },
  epic: { label: "Epic", icon: Zap, color: "text-purple-500" },
  subtask: { label: "Sub-task", icon: ListTree, color: "text-sky-500" },
};

export const ISSUE_PRIORITY_META: Record<IssuePriority, OptionMeta> = {
  low: { label: "Low", icon: ChevronDown, color: "text-sky-500" },
  medium: { label: "Medium", icon: Equal, color: "text-amber-500" },
  high: { label: "High", icon: ChevronUp, color: "text-red-500" },
};

export const ISSUE_STATUS_META: Record<IssueStatus, OptionMeta & { badge: string }> = {
  todo: { label: "To Do", dot: "bg-zinc-400", badge: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400" },
  "in-progress": { label: "In Progress", dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  done: { label: "Done", dot: "bg-green-500", badge: "bg-green-500/15 text-green-600 dark:text-green-400" },
};
