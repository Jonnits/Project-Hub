"use client";

import { MoreHorizontal, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BoardColumn } from "@/components/board/column";
import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { IssueCardFace } from "@/components/board/issue-card";
import { IssueSheet } from "@/components/board/issue-sheet";
import { useIssueDrag } from "@/components/board/use-issue-drag";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { issueKey } from "@/lib/format";
import { PRIORITIES, PriorityIcon, priorityLabel } from "@/lib/priorities";
import { useBoardStore } from "@/lib/store";
import type { Issue, Priority } from "@/lib/types";

function matchesFilters(
  issue: Issue,
  query: string,
  assignee: string,
  priority: string,
  label: string,
  projectKey: string
) {
  const needle = query.trim().toLowerCase();
  if (needle) {
    const hay = `${issue.title} ${issue.description} ${issueKey(projectKey, issue.number)}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  if (assignee === "unassigned" && issue.assigneeId) return false;
  if (assignee && assignee !== "all" && assignee !== "unassigned" && issue.assigneeId !== assignee) {
    return false;
  }
  if (priority && priority !== "all" && issue.priority !== priority) return false;
  if (label && label !== "all" && !issue.labelIds.includes(label)) return false;
  return true;
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useBoardStore((state) =>
    state.projects.find((item) => item.id === projectId)
  );
  const issues = useBoardStore((state) => state.issues);
  const people = useBoardStore((state) => state.people);
  const labels = useBoardStore((state) => state.labels);
  const moveIssue = useBoardStore((state) => state.moveIssue);
  const deleteProject = useBoardStore((state) => state.deleteProject);

  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [label, setLabel] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | undefined>();
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const lastDragAt = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const handleDropIssue = useCallback(
    (issueId: string, columnId: string, beforeIssueId?: string | null) => {
      lastDragAt.current = Date.now();
      moveIssue(issueId, columnId, beforeIssueId);
    },
    [moveIssue]
  );
  const { drag, startDrag, didJustDrag } = useIssueDrag(handleDropIssue);

  const projectIssues = useMemo(
    () =>
      issues
        .filter((issue) => issue.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [issues, projectId]
  );

  const filteredIssues = useMemo(() => {
    if (!project) return [];
    return projectIssues.filter((issue) =>
      matchesFilters(issue, query, assignee, priority, label, project.key)
    );
  }, [project, projectIssues, query, assignee, priority, label]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "c" && !event.metaKey && !event.ctrlKey && !typing) {
        event.preventDefault();
        setCreateStatus(undefined);
        setCreateOpen(true);
      }
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-medium">This project was deleted or never existed.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to projects
        </Button>
      </div>
    );
  }

  function openCreate(columnId?: string) {
    setCreateStatus(columnId);
    setCreateOpen(true);
  }

  function handleOpenIssue(id: string) {
    if (didJustDrag() || Date.now() - lastDragAt.current < 280) return;
    setOpenIssueId(id);
  }

  const draggingIssue =
    drag ? projectIssues.find((issue) => issue.id === drag.issueId) ?? null : null;

  const doneId = project.columns[project.columns.length - 1]?.id;
  const openCount = projectIssues.filter((issue) => issue.status !== doneId).length;
  const pointTotal = projectIssues
    .filter((issue) => issue.status !== doneId)
    .reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-[3px]"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="font-heading truncate text-lg tracking-tight">
              {project.name}
            </h1>
            <span className="font-mono text-xs text-muted-foreground">
              {project.key}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {openCount} open · {projectIssues.length} issues
            {pointTotal > 0 ? ` · ${pointTotal} pts remaining` : ""}
            {project.description ? ` · ${project.description}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 lg:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues  /"
              className="pl-8 lg:w-56"
            />
          </div>
          <FilterSelect
            label="Assignee"
            value={assignee}
            onChange={setAssignee}
            options={[
              { value: "all", label: "All assignees" },
              { value: "unassigned", label: "Unassigned" },
              ...people.map((person) => ({
                value: person.id,
                label: person.name,
              })),
            ]}
          />
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: "all", label: "All priorities" },
              ...PRIORITIES.map((item) => ({
                value: item,
                label: priorityLabel(item),
              })),
            ]}
          />
          <FilterSelect
            label="Label"
            value={label}
            onChange={setLabel}
            options={[
              { value: "all", label: "All labels" },
              ...labels.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
          <Button type="button" onClick={() => openCreate()}>
            New issue
            <kbd className="ml-1 hidden rounded border border-primary-foreground/20 px-1 font-mono text-[10px] sm:inline">
              C
            </kbd>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" aria-label="Project actions" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  deleteProject(project.id);
                  router.push("/");
                }}
              >
                Delete project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                Back to projects
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 py-4">
        {project.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            project={project}
            issues={filteredIssues.filter((issue) => issue.status === column.id)}
            onOpenIssue={handleOpenIssue}
            onAddIssue={openCreate}
            onPointerDragStart={startDrag}
            draggingIssueId={drag?.issueId}
            isOver={drag?.overColumnId === column.id}
          />
        ))}
      </div>

      {drag && draggingIssue && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50 w-72"
              style={{
                left: drag.x - drag.offsetX,
                top: drag.y - drag.offsetY,
              }}
            >
              <IssueCardFace
                issue={draggingIssue}
                project={project}
                className="rotate-1 shadow-lg ring-1 ring-foreground/10"
              />
            </div>,
            document.body
          )
        : null}

      {filteredIssues.length === 0 && projectIssues.length > 0 ? (
        <p className="px-6 pb-4 text-sm text-muted-foreground">
          No issues match these filters.
        </p>
      ) : null}

      <CreateIssueDialog
        project={project}
        open={createOpen}
        defaultStatus={createStatus}
        onOpenChange={setCreateOpen}
      />
      <IssueSheet issueId={openIssueId} onClose={() => setOpenIssueId(null)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find((option) => option.value === value)?.label ?? label;
  const isDefault = value === "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={isDefault ? "text-muted-foreground" : undefined}
          />
        }
      >
        {isDefault ? label : current}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.value.startsWith("urgent") ||
            PRIORITIES.includes(option.value as Priority) ? (
              <span className="flex items-center gap-2">
                {PRIORITIES.includes(option.value as Priority) ? (
                  <PriorityIcon priority={option.value as Priority} />
                ) : null}
                {option.label}
              </span>
            ) : (
              option.label
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
