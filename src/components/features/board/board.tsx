"use client";

import { useId, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCan } from "@/components/layout/workspace-provider";
import { useBoard, useMoveIssue } from "@/hooks/use-board";
import { findCard } from "@/lib/board";
import { ISSUE_STATUSES } from "@/types/issue";
import type { Board as BoardData, IssueStatus } from "@/types/issue";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";

const isStatus = (id: string): id is IssueStatus => (ISSUE_STATUSES as readonly string[]).includes(id);

export function Board({
  projectId,
  projectKey,
  workspaceSlug,
  initialBoard,
  mine = false,
}: {
  projectId: string;
  projectKey: string;
  workspaceSlug: string;
  initialBoard: BoardData;
  /** "My issues" filter is on */
  mine?: boolean;
}) {
  const filter = { mine };
  const { data: board } = useBoard(projectId, filter, initialBoard);
  const move = useMoveIssue(projectId, filter);
  const canEdit = useCan("editIssues");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeAt = activeId ? findCard(board, activeId) : null;
  const activeCard = activeAt ? board[activeAt.status][activeAt.index] : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const overId = String(over.id);

    if (isStatus(overId)) {
      move(String(active.id), overId, board[overId].length); // empty area of a column → bottom
    } else {
      const at = findCard(board, overId); // over a card → take its slot
      if (at) move(String(active.id), at.status, at.index);
    }
  }

  return (
    <DndContext
      id={useId()}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ISSUE_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            issues={board[status]}
            canEdit={canEdit}
            issueHref={(key) => `/${workspaceSlug}/projects/${projectKey}/issues/${key}`}
          />
        ))}
      </div>
      <DragOverlay>{activeCard ? <BoardCard issue={activeCard} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
