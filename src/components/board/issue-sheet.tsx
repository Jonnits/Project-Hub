"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative, issueKey } from "@/lib/format";
import { PRIORITIES, PriorityIcon, priorityLabel } from "@/lib/priorities";
import { STORY_POINTS, storyPointLabel } from "@/lib/story-points";
import { useBoardStore } from "@/lib/store";
import type { Issue, Priority, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IssueSheet({
  issueId,
  onClose,
}: {
  issueId: string | null;
  onClose: () => void;
}) {
  const issue = useBoardStore((state) =>
    state.issues.find((item) => item.id === issueId)
  );
  const project = useBoardStore((state) =>
    state.projects.find((item) => item.id === issue?.projectId)
  );

  return (
    <Sheet open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-md"
        showCloseButton
      >
        {issue && project ? (
          <IssueEditor
            key={issue.id}
            issue={issue}
            project={project}
            onClose={onClose}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function IssueEditor({
  issue,
  project,
  onClose,
}: {
  issue: Issue;
  project: Project;
  onClose: () => void;
}) {
  const people = useBoardStore((state) => state.people);
  const labels = useBoardStore((state) => state.labels);
  const updateIssue = useBoardStore((state) => state.updateIssue);
  const deleteIssue = useBoardStore((state) => state.deleteIssue);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitTitle() {
    const next = title.trim();
    if (next && next !== issue.title) {
      updateIssue(issue.id, { title: next });
    } else setTitle(issue.title);
  }

  function commitDescription() {
    if (description !== issue.description) {
      updateIssue(issue.id, { description });
    }
  }

  function toggleLabel(labelId: string) {
    const next = issue.labelIds.includes(labelId)
      ? issue.labelIds.filter((id) => id !== labelId)
      : [...issue.labelIds, labelId];
    updateIssue(issue.id, { labelIds: next });
  }

  return (
    <>
      <SheetHeader className="border-b border-border/80">
        <SheetDescription className="font-mono text-xs" suppressHydrationWarning>
          {issueKey(project.key, issue.number)} · updated{" "}
          {formatRelative(issue.updatedAt)}
        </SheetDescription>
        <SheetTitle className="sr-only">{issue.title}</SheetTitle>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              (event.target as HTMLInputElement).blur();
            }
          }}
          className="font-heading h-auto border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Description
          </span>
          <Textarea
            value={description}
            placeholder="Add context, repro steps, or a proposed fix."
            className="min-h-28"
            onChange={(event) => setDescription(event.target.value)}
            onBlur={commitDescription}
          />
        </label>

        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Status
            </span>
              <Select
                value={issue.status}
                items={project.columns.map((column) => ({
                  value: column.id,
                  label: column.name,
                }))}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    updateIssue(issue.id, { status: value });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      project.columns.find((column) => column.id === value)
                        ?.name ?? "Status"
                    }
                  </SelectValue>
                </SelectTrigger>
              <SelectContent>
                {project.columns.map((column) => (
                  <SelectItem key={column.id} value={column.id} label={column.name}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Priority
            </span>
            <Select
              value={issue.priority}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  updateIssue(issue.id, { priority: value as Priority });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() => (
                    <span className="flex items-center gap-2">
                      <PriorityIcon priority={issue.priority} />
                      {priorityLabel(issue.priority)}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <span className="flex items-center gap-2">
                      <PriorityIcon priority={priority} />
                      {priorityLabel(priority)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Assignee
            </span>
            <Select
              value={issue.assigneeId ?? "unassigned"}
              onValueChange={(value) => {
                if (typeof value !== "string") return;
                updateIssue(issue.id, {
                  assigneeId: value === "unassigned" ? null : value,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    !value || value === "unassigned"
                      ? "Unassigned"
                      : (people.find((person) => person.id === value)?.name ??
                        "Unassigned")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <span className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback
                          className="text-[10px] text-white"
                          style={{ backgroundColor: person.color }}
                        >
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      {person.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Story points
            </span>
            <Select
              value={issue.storyPoints == null ? "none" : String(issue.storyPoints)}
              onValueChange={(value) => {
                if (typeof value !== "string") return;
                updateIssue(issue.id, {
                  storyPoints: value === "none" ? null : Number(value),
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    storyPointLabel(value === "none" || !value ? null : Number(value))
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No estimate</SelectItem>
                {STORY_POINTS.map((points) => (
                  <SelectItem key={points} value={String(points)}>
                    {storyPointLabel(points)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Labels
          </span>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const active = issue.labelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs transition",
                    active
                      ? "border-transparent text-white"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    active
                      ? { backgroundColor: label.color }
                      : { borderColor: `${label.color}55` }
                  }
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="border-t border-border/80 p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
          Delete issue
        </Button>
      </div>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this issue?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this issue? {issueKey(project.key, issue.number)} will be removed from the board. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                deleteIssue(issue.id);
                setConfirmDelete(false);
                onClose();
              }}
            >
              Delete issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
