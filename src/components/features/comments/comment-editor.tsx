"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Bold, Code, Italic, List, ListOrdered, SquareCode, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tiptap = a headless rich-text editor (ProseMirror underneath). StarterKit brings paragraphs, bold,
 * italic, lists, code, blockquotes, links... We only expose a few in the toolbar.
 *
 * The editor produces HTML. That HTML is NOT trusted: the API sanitizes it before storing (sanitize-comment.ts).
 * The editor is just a nicer way to type; it is not a security boundary.
 */
export function CommentEditor({
  initialHtml = "",
  placeholder = "Add a comment...",
  submitLabel = "Save",
  pending = false,
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  initialHtml?: string;
  placeholder?: string;
  submitLabel?: string;
  pending?: boolean;
  /** return true to clear the editor (e.g. after posting a new comment) */
  onSubmit: (html: string) => Promise<boolean>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] }, link: { openOnClick: false, autolink: true } }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    autofocus: autoFocus ? "end" : false,
    // Next renders on the server first; the editor only exists in the browser.
    // Rendering immediately would produce different HTML on server and client (hydration mismatch).
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "rich-text min-h-20 px-3 py-2 outline-none", "aria-label": placeholder },
      // Ctrl/Cmd+Enter submits, like most comment boxes
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          void submit();
          return true;
        }
        return false;
      },
    },
  });

  // re-render the toolbar when the selection's marks change (bold on/off...)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      empty: e?.isEmpty ?? true,
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      strike: e?.isActive("strike") ?? false,
      code: e?.isActive("code") ?? false,
      bulletList: e?.isActive("bulletList") ?? false,
      orderedList: e?.isActive("orderedList") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
    }),
  });

  async function submit() {
    if (!editor || editor.isEmpty || pending) return;
    const clear = await onSubmit(editor.getHTML());
    if (clear) editor.commands.clearContent();
  }

  const tools = [
    { key: "bold", icon: Bold, label: "Bold", run: () => editor?.chain().focus().toggleBold().run() },
    { key: "italic", icon: Italic, label: "Italic", run: () => editor?.chain().focus().toggleItalic().run() },
    { key: "strike", icon: Strikethrough, label: "Strikethrough", run: () => editor?.chain().focus().toggleStrike().run() },
    { key: "code", icon: Code, label: "Inline code", run: () => editor?.chain().focus().toggleCode().run() },
    { key: "bulletList", icon: List, label: "Bullet list", run: () => editor?.chain().focus().toggleBulletList().run() },
    {
      key: "orderedList",
      icon: ListOrdered,
      label: "Numbered list",
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    { key: "codeBlock", icon: SquareCode, label: "Code block", run: () => editor?.chain().focus().toggleCodeBlock().run() },
  ] as const;

  return (
    <div className="rounded-md border focus-within:ring-2 focus-within:ring-ring/50">
      <div className="flex gap-0.5 border-b p-1" role="toolbar" aria-label="Formatting">
        {tools.map(({ key, icon: Icon, label, run }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7", state?.[key] && "bg-muted text-foreground")}
            aria-label={label}
            aria-pressed={state?.[key] ?? false}
            onClick={run}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end gap-2 border-t p-2">
        <span className="mr-auto text-xs text-muted-foreground">Ctrl+Enter to save</span>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="button" size="sm" disabled={state?.empty || pending} onClick={() => void submit()}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
