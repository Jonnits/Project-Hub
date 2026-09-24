"use client";

import { Plus } from "lucide-react";

import { IssueCard } from "@/components/board/issue-card";
import { Button } from "@/components/ui/button";
import type { Column, Issue, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BoardColumn({
  column,
  project,
  issues,
  onOpenIssue,
  onAddIssue,
  onPointerDragStart,
  draggingIssueId,
  isOver,
}: {
  column: Column;
  project: Project;
  issues: Issue[];
  onOpenIssue: (id: string) => void;
  onAddIssue: (columnId: string) => void;
  onPointerDragStart: (issueId: string, event: React.PointerEvent) => void;
  draggingIssueId?: string | null;
  isOver?: boolean;
}) {
  const overLimit =
    column.wipLimit !== null && issues.length > column.wipLimit;
  const atLimit =
    column.wipLimit !== null && issues.length >= column.wipLimit;

  return (
    <section
      data-column-id={column.id}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-transparent bg-muted/25",
        isOver && "border-primary/40 bg-muted/45",
        overLimit && "border-destructive/40"
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <h2 className="font-heading text-[13px]">{column.name}</h2>
        <span
          className={cn(
            "rounded-full px-1.5 font-mono text-[11px] text-muted-foreground",
            overLimit && "text-destructive"
          )}
        >
          {issues.length}
          {column.wipLimit !== null ? `/${column.wipLimit}` : ""}
        </span>
        {overLimit ? (
          <span className="text-[11px] text-destructive">WIP exceeded</span>
        ) : atLimit ? (
          <span className="text-[11px] text-amber-500">WIP limit</span>
        ) : null}
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="ml-auto"
          aria-label={`Add issue to ${column.name}`}
          onClick={() => onAddIssue(column.id)}
        >
          <Plus />
        </Button>
      </header>
      <div
        data-column-id={column.id}
        className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3"
      >
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            project={project}
            onOpen={onOpenIssue}
            onPointerDragStart={onPointerDragStart}
            dragging={draggingIssueId === issue.id}
          />
        ))}
        {issues.length === 0 ? (
          <div
            data-column-id={column.id}
            className="flex min-h-32 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-3 py-6 text-center"
          >
            <p className="text-xs text-muted-foreground">Drop issues here</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onAddIssue(column.id)}
            >
              Add one
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
