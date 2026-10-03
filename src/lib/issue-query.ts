import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "@/types/issue";
import type { IssuePriority, IssueStatus, IssueType } from "@/types/issue";

export const PAGE_SIZE = 20;
export const ISSUE_SORTS = ["-number", "number", "title", "-title"] as const;
export type IssueSort = (typeof ISSUE_SORTS)[number];

export interface IssueQuery {
  status?: IssueStatus;
  type?: IssueType;
  priority?: IssuePriority;
  q?: string;
  sort: IssueSort;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) =>
  allowed.includes(v as T) ? (v as T) : undefined;

export function parseIssueQuery(raw: RawParams): IssueQuery {
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  return {
    status: pick(first(raw.status), ISSUE_STATUSES),
    type: pick(first(raw.type), ISSUE_TYPES),
    priority: pick(first(raw.priority), ISSUE_PRIORITIES),
    q: first(raw.q)?.trim().slice(0, 100) || undefined,
    sort: pick(first(raw.sort), ISSUE_SORTS) ?? "-number",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function toQueryString(
  query: IssueQuery,
  overrides: Partial<Record<keyof IssueQuery | "limit", string | number | undefined>> = {},
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...query, ...overrides })) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  if (params.get("sort") === "-number") params.delete("sort");
  if (params.get("page") === "1") params.delete("page");
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (q: IssueQuery) => Boolean(q.status || q.type || q.priority || q.q);
