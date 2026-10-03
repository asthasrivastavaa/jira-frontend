import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Project not found"
      description="It may have been deleted, or the key is wrong."
      action={
        <Link href="/projects" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to projects
        </Link>
      }
    />
  );
}
