import { cn } from "@/lib/utils";

// Until avatar uploads exist (4.1), a user is shown as initials on a color derived from their id.
// Derived (not random) so the same person always gets the same color on every page.
const COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-600", "bg-teal-600", "bg-blue-600", "bg-violet-600", "bg-pink-600"];

function colorFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: { _id?: string; userId?: string; name: string } | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "size-5 text-[10px]" : "size-6 text-xs";
  if (!user) {
    return (
      <span
        className={cn("inline-flex shrink-0 rounded-full border border-dashed border-muted-foreground/50", box, className)}
        aria-label="Unassigned"
      />
    );
  }
  return (
    <span
      title={user.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        box,
        colorFor(user._id ?? user.userId ?? user.name),
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}
