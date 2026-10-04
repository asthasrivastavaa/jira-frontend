import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/validations/auth";

const BAR = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];
const TEXT = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-green-500"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = getPasswordStrength(password);
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full bg-muted transition-colors duration-300", i <= score && BAR[score])}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", TEXT[score])}>
        {label}
        <span className="font-normal text-muted-foreground"> · 12+ characters with numbers and symbols is stronger</span>
      </p>
    </div>
  );
}
