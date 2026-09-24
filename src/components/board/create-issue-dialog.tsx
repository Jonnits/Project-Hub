"use client";

import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, PriorityIcon, priorityLabel } from "@/lib/priorities";
import { STORY_POINTS, storyPointLabel } from "@/lib/story-points";
import { useBoardStore } from "@/lib/store";
import type { Priority, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreateIssueDialog({
  project,
  open,
  defaultStatus,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  defaultStatus?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <CreateIssueForm
            key={`${project.id}:${defaultStatus ?? "default"}`}
            project={project}
            defaultStatus={defaultStatus}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateIssueForm({
  project,
  defaultStatus,
  onClose,
}: {
  project: Project;
  defaultStatus?: string;
  onClose: () => void;
}) {
  const people = useBoardStore((state) => state.people);
  const labels = useBoardStore((state) => state.labels);
  const createIssue = useBoardStore((state) => state.createIssue);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus ?? project.columns[0]?.id);
  const [priority, setPriority] = useState<Priority>("none");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [storyPoints, setStoryPoints] = useState<string>("none");

  function toggleLabel(id: string) {
    setLabelIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!title.trim() || !status) return;
    createIssue({
      projectId: project.id,
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      labelIds,
      storyPoints: storyPoints === "none" ? null : Number(storyPoints),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>New issue</DialogTitle>
        <DialogDescription>
          Created in {project.name} as the next {project.key} number.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <Input
          autoFocus
          value={title}
          placeholder="Issue title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          value={description}
          placeholder="Description (optional)"
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={status}
            items={project.columns.map((column) => ({
              value: column.id,
              label: column.name,
            }))}
            onValueChange={(value) => typeof value === "string" && setStatus(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  project.columns.find((column) => column.id === value)?.name ??
                  "Status"
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
          <Select
            value={priority}
            onValueChange={(value) =>
              typeof value === "string" && setPriority(value as Priority)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() => (
                  <span className="flex items-center gap-2">
                    <PriorityIcon priority={priority} />
                    {priorityLabel(priority)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((item) => (
                <SelectItem key={item} value={item}>
                  <span className="flex items-center gap-2">
                    <PriorityIcon priority={item} />
                    {priorityLabel(item)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={assigneeId}
            onValueChange={(value) =>
              typeof value === "string" && setAssigneeId(value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value === "unassigned" || !value
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
          <Select
            value={storyPoints}
            onValueChange={(value) =>
              typeof value === "string" && setStoryPoints(value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  !value || value === "none"
                    ? "No estimate"
                    : storyPointLabel(Number(value))
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
        </div>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => {
            const active = labelIds.includes(label.id);
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!title.trim()} onClick={handleSubmit}>
          Create issue
        </Button>
      </DialogFooter>
    </form>
  );
}
