"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { issueKey } from "@/lib/format";
import { PriorityIcon } from "@/lib/priorities";
import { useBoardStore } from "@/lib/store";
import type { Issue, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IssueCardFace({
  issue,
  project,
  className,
}: {
  issue: Issue;
  project: Project;
  className?: string;
}) {
  const people = useBoardStore((state) => state.people);
  const labels = useBoardStore((state) => state.labels);
  const assignee = people.find((person) => person.id === issue.assigneeId);
  const issueLabels = labels.filter((label) => issue.labelIds.includes(label.id));

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card p-3 text-left shadow-sm",
        className
      )}
    >
      <p className="font-heading text-[13px] leading-snug text-balance">
        {issue.title}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {issueKey(project.key, issue.number)}
        </span>
        <PriorityIcon priority={issue.priority} />
        {issue.storyPoints != null ? (
          <span
            className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
            title={`${issue.storyPoints} story points`}
          >
            {issue.storyPoints}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          {issueLabels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${label.color}22`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {assignee ? (
            <Avatar size="sm">
              <AvatarFallback
                className="text-[10px] font-medium text-white"
                style={{ backgroundColor: assignee.color }}
              >
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function IssueCard({
  issue,
  project,
  onOpen,
  onPointerDragStart,
  dragging = false,
}: {
  issue: Issue;
  project: Project;
  onOpen?: (id: string) => void;
  onPointerDragStart?: (issueId: string, event: React.PointerEvent) => void;
  dragging?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-issue-id={issue.id}
      className={cn(
        "w-full cursor-grab touch-none rounded-lg ring-foreground/5 transition select-none active:cursor-grabbing",
        "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        dragging && "opacity-40"
      )}
      onPointerDown={(event) => onPointerDragStart?.(issue.id, event)}
      onClick={() => onOpen?.(issue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(issue.id);
        }
      }}
    >
      <IssueCardFace
        issue={issue}
        project={project}
        className="hover:border-border"
      />
    </div>
  );
}
