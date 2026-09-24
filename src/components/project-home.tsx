"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/format";
import { useBoardStore } from "@/lib/store";
import type { Project } from "@/lib/types";

function ProjectCard({ project }: { project: Project }) {
  const issues = useBoardStore((state) => state.issues).filter(
    (issue) => issue.projectId === project.id
  );
  const doneId = project.columns[project.columns.length - 1]?.id;
  const counts = project.columns.map((column) => ({
    id: column.id,
    name: column.name,
    count: issues.filter((issue) => issue.status === column.id).length,
  }));
  const open = issues.filter((issue) => issue.status !== doneId).length;
  const latest = issues.reduce(
    (acc, issue) => (issue.updatedAt > acc ? issue.updatedAt : acc),
    project.createdAt
  );
  const total = Math.max(issues.length, 1);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition hover:border-border hover:bg-card/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: project.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-heading truncate">{project.name}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {project.key}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.description || "No description yet."}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
          {formatRelative(latest)}
        </span>
      </div>
      <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-muted">
        {counts.map((column) =>
          column.count === 0 ? null : (
            <span
              key={column.id}
              className="h-full"
              style={{
                width: `${(column.count / total) * 100}%`,
                backgroundColor: project.color,
                opacity:
                  column.id === doneId
                    ? 0.35
                    : 0.55 + (column.count / total) * 0.45,
              }}
              title={`${column.name}: ${column.count}`}
            />
          )
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {open} open · {issues.length} total
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">
          Open board →
        </span>
      </div>
    </Link>
  );
}

export function ProjectHome() {
  const projects = useBoardStore((state) => state.projects);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(needle) ||
        project.key.toLowerCase().includes(needle) ||
        project.description.toLowerCase().includes(needle)
    );
  }, [projects, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-4 border-b border-border/80 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h1 className="font-heading text-xl tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Development boards with Linear-style issues and Trello-style drag
            and drop.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New project
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="font-heading">
              {projects.length === 0 ? "No projects yet" : "No matching projects"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {projects.length === 0
                ? "Create a project to get a kanban board with Backlog, Todo, In Progress, In Review, and Done."
                : "Try a different search, or create a new project."}
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus />
              New project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
