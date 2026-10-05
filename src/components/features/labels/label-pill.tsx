import { cn } from "@/lib/utils";

/**
 * Text on a colored background is the classic contrast trap. Instead of white text on a solid color,
 * the pill uses the color itself for the text on a ~12% tint of the same color: readable in light AND dark mode
 * for every color in the fixed palette.
 */
export function LabelPill({ label, className }: { label: { name: string; color: string }; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded px-1.5 text-xs font-medium", className)}
      style={{ color: label.color, backgroundColor: `${label.color}1f`, boxShadow: `inset 0 0 0 1px ${label.color}40` }}
    >
      {label.name}
    </span>
  );
}
