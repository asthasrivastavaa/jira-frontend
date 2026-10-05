"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCan, useCurrentUser, useWorkspace } from "@/components/layout/workspace-provider";
import { UserAvatar } from "@/components/shared/user-avatar";
import { hasRole } from "@/lib/permissions";
import { timeAgo } from "@/lib/dates";
import { commentsKey, createComment, deleteComment, listComments, updateComment } from "@/lib/api/comments";
import type { Comment } from "@/lib/api/comments";
import type { CursorMeta } from "@/lib/api/client";
import { CommentEditor } from "./comment-editor";

type Page = { data: Comment[]; meta: CursorMeta };
type Pages = InfiniteData<Page, string | null>;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

/**
 * useInfiniteQuery keeps a LIST of pages under one cache key. Each page knows the cursor for the next
 * (getNextPageParam), and fetchNextPage() appends the next page. "Load older comments" is just that.
 * New / edited / deleted comments are written straight into the cached pages, no refetch needed.
 */
export function CommentThread({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient();
  const key = commentsKey(issueId);
  const canComment = useCan("editIssues");

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => listComments(issueId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });

  const setPages = (fn: (pages: Page[]) => Page[]) =>
    queryClient.setQueryData<Pages>(key, (old) => (old ? { ...old, pages: fn(old.pages) } : old));

  const create = useMutation({
    mutationFn: (html: string) => createComment(issueId, html),
    // newest first: the new comment goes on top of the first page
    onSuccess: (comment) => setPages((pages) => pages.map((p, i) => (i === 0 ? { ...p, data: [comment, ...p.data] } : p))),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const comments = query.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      {canComment && (
        <CommentEditor
          submitLabel="Comment"
          pending={create.isPending}
          onSubmit={async (html) => {
            try {
              await create.mutateAsync(html);
              return true;
            } catch {
              return false; // keep the text so nothing is lost
            }
          }}
        />
      )}

      {query.isPending ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Could not load comments.</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <CommentItem key={c._id} issueId={issueId} comment={c} setPages={setPages} />
          ))}
        </ul>
      )}

      {query.hasNextPage && (
        <Button variant="ghost" size="sm" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? "Loading..." : "Load older comments"}
        </Button>
      )}
    </div>
  );
}

function CommentItem({
  issueId,
  comment,
  setPages,
}: {
  issueId: string;
  comment: Comment;
  setPages: (fn: (pages: Page[]) => Page[]) => void;
}) {
  const me = useCurrentUser();
  const { role } = useWorkspace();
  const [editing, setEditing] = useState(false);

  // mirrors the API rules (the API is still the one that enforces them)
  const isAuthor = comment.authorId._id === me.id;
  const canEdit = isAuthor && hasRole(role, "member");
  const canDelete = (isAuthor && hasRole(role, "member")) || hasRole(role, "admin");

  const replace = (updated: Comment) =>
    setPages((pages) => pages.map((p) => ({ ...p, data: p.data.map((c) => (c._id === updated._id ? updated : c)) })));

  const update = useMutation({
    mutationFn: (html: string) => updateComment(issueId, comment._id, html),
    onSuccess: (updated) => {
      replace(updated);
      setEditing(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => deleteComment(issueId, comment._id),
    onSuccess: () => setPages((pages) => pages.map((p) => ({ ...p, data: p.data.filter((c) => c._id !== comment._id) }))),
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <li className="flex gap-3">
      <UserAvatar user={comment.authorId} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{comment.authorId.name}</span>
          <time className="text-xs text-muted-foreground" dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()}>
            {timeAgo(comment.createdAt)}
          </time>
          {comment.editedAt && (
            <span className="text-xs text-muted-foreground" title={`Edited ${new Date(comment.editedAt).toLocaleString()}`}>
              (edited)
            </span>
          )}
          {(canEdit || canDelete) && !editing && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="ml-auto size-7" aria-label="Comment actions" />}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && <DropdownMenuItem onClick={() => setEditing(true)}>Edit</DropdownMenuItem>}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete this comment?")) remove.mutate();
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {editing ? (
          <CommentEditor
            initialHtml={comment.body}
            submitLabel="Save"
            autoFocus
            pending={update.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={async (html) => {
              await update.mutateAsync(html).catch(() => undefined);
              return false;
            }}
          />
        ) : (
          // Safe ONLY because the API sanitized this HTML before storing it (allow-list of tags, no attributes
          // except safe links). Never render user HTML that hasn't been through a sanitizer.
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: comment.body }} />
        )}
      </div>
    </li>
  );
}
