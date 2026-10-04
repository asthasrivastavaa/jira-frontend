"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn't load projects"
      description={error.message}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
