"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentThread } from "@/components/features/comments/comment-thread";
import { ActivityTimeline } from "@/components/features/activity/activity-timeline";

/** Comments | History under the issue description. Each panel loads its own data when first shown. */
export function IssueTabs({ issueId }: { issueId: string }) {
  return (
    <Tabs defaultValue="comments" className="mt-8">
      <TabsList variant="line">
        <TabsTrigger value="comments">Comments</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="comments" className="pt-4">
        <CommentThread issueId={issueId} />
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        <ActivityTimeline issueId={issueId} />
      </TabsContent>
    </Tabs>
  );
}
