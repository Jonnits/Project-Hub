"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { keyFromName, uid } from "@/lib/format";
import { createSeedWorkspace } from "@/lib/seed";
import type { Issue, Priority, Project, Workspace } from "@/lib/types";

const DEFAULT_COLUMNS = [
  { name: "Backlog", wipLimit: null as number | null },
  { name: "Todo", wipLimit: null },
  { name: "In Progress", wipLimit: 3 },
  { name: "In Review", wipLimit: 4 },
  { name: "Done", wipLimit: null },
];

type CreateProjectInput = {
  name: string;
  key?: string;
  description: string;
  color: string;
};

type CreateIssueInput = {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assigneeId?: string | null;
  labelIds?: string[];
  storyPoints?: number | null;
};

type UpdateIssueInput = Partial<
  Pick<
    Issue,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "assigneeId"
    | "labelIds"
    | "storyPoints"
  >
>;

type BoardStore = Workspace & {
  createProject: (input: CreateProjectInput) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "description" | "color">>) => void;
  deleteProject: (id: string) => void;
  createIssue: (input: CreateIssueInput) => string;
  updateIssue: (id: string, patch: UpdateIssueInput) => void;
  deleteIssue: (id: string) => void;
  moveIssue: (issueId: string, toColumnId: string, beforeIssueId?: string | null) => void;
  resetDemo: () => void;
};

function now() {
  return new Date().toISOString();
}

function nextOrder(issues: Issue[], projectId: string, status: string) {
  const dest = issues.filter((issue) => issue.projectId === projectId && issue.status === status);
  if (dest.length === 0) return 0;
  return Math.max(...dest.map((issue) => issue.order)) + 1;
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...createSeedWorkspace(),
      createProject: (input) => {
        const id = uid("proj");
        const key = (input.key || keyFromName(input.name)).slice(0, 5).toUpperCase();
        const createdAt = now();
        const project: Project = {
          id,
          name: input.name.trim(),
          key,
          description: input.description.trim(),
          color: input.color,
          createdAt,
          columns: DEFAULT_COLUMNS.map((column) => ({
            id: uid("col"),
            name: column.name,
            wipLimit: column.wipLimit,
          })),
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return id;
      },
      updateProject: (id, patch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...patch } : project
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          issues: state.issues.filter((issue) => issue.projectId !== id),
        }));
      },
      createIssue: (input) => {
        const project = get().projects.find((item) => item.id === input.projectId);
        if (!project) throw new Error("Project not found");
        const status = input.status ?? project.columns[0]?.id;
        if (!status) throw new Error("Project has no columns");
        const issues = get().issues.filter((issue) => issue.projectId === input.projectId);
        const number =
          issues.length === 0 ? 1 : Math.max(...issues.map((issue) => issue.number)) + 1;
        const createdAt = now();
        const id = uid("issue");
        const issue: Issue = {
          id,
          projectId: input.projectId,
          number,
          title: input.title.trim(),
          description: input.description?.trim() ?? "",
          status,
          priority: input.priority ?? "none",
          assigneeId: input.assigneeId ?? null,
          labelIds: input.labelIds ?? [],
          storyPoints: input.storyPoints ?? null,
          order: nextOrder(get().issues, input.projectId, status),
          createdAt,
          updatedAt: createdAt,
        };
        set((state) => ({ issues: [...state.issues, issue] }));
        return id;
      },
      updateIssue: (id, patch) => {
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id
              ? {
                  ...issue,
                  ...patch,
                  title: patch.title?.trim() ?? issue.title,
                  description:
                    patch.description !== undefined
                      ? patch.description
                      : issue.description,
                  updatedAt: now(),
                }
              : issue
          ),
        }));
      },
      deleteIssue: (id) => {
        set((state) => ({
          issues: state.issues.filter((issue) => issue.id !== id),
        }));
      },
      moveIssue: (issueId, toColumnId, beforeIssueId) => {
        const issue = get().issues.find((item) => item.id === issueId);
        if (!issue) return;
        const siblings = get()
          .issues.filter(
            (item) =>
              item.projectId === issue.projectId &&
              item.status === toColumnId &&
              item.id !== issueId
          )
          .sort((a, b) => a.order - b.order);

        let order: number;
        if (beforeIssueId) {
          const index = siblings.findIndex((item) => item.id === beforeIssueId);
          if (index === -1) {
            order = siblings.length === 0 ? 0 : siblings[siblings.length - 1].order + 1;
          } else if (index === 0) {
            order = siblings[0].order - 1;
          } else {
            order = (siblings[index - 1].order + siblings[index].order) / 2;
          }
        } else {
          order = siblings.length === 0 ? 0 : siblings[siblings.length - 1].order + 1;
        }

        set((state) => ({
          issues: state.issues.map((item) =>
            item.id === issueId
              ? { ...item, status: toColumnId, order, updatedAt: now() }
              : item
          ),
        }));
      },
      resetDemo: () => {
        set({ ...createSeedWorkspace() });
      },
    }),
    {
      name: "project-hub-board",
      version: 2,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as Workspace;
        return {
          ...state,
          issues: (state.issues ?? []).map((issue) => ({
            ...issue,
            storyPoints: issue.storyPoints ?? null,
          })),
        };
      },
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return {
          getItem: (name) =>
            window.localStorage.getItem(name) ??
            window.localStorage.getItem("forge-board"),
          setItem: (name, value) => window.localStorage.setItem(name, value),
          removeItem: (name) => window.localStorage.removeItem(name),
        };
      }),
      partialize: (state) => ({
        people: state.people,
        labels: state.labels,
        projects: state.projects,
        issues: state.issues,
      }),
    }
  )
);

