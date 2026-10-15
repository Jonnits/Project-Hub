import { keyFromName, uid } from "@/lib/format";
import type { Column, Issue, Priority, Project, Workspace } from "@/lib/types";

export const DEFAULT_COLUMNS = [
  { name: "Backlog", wipLimit: null as number | null },
  { name: "Todo", wipLimit: null },
  { name: "In Progress", wipLimit: 3 },
  { name: "In Review", wipLimit: 4 },
  { name: "Done", wipLimit: null },
];

export type CreateProjectInput = {
  name: string;
  key?: string;
  description: string;
  color: string;
  ownerId: string;
  id?: string;
  columns?: Column[];
};

export type CreateIssueInput = {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assigneeId?: string | null;
  labelIds?: string[];
  storyPoints?: number | null;
  id?: string;
  number?: number;
};

export type UpdateIssueInput = Partial<
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

export type Op =
  | { id: string; at: string; type: "createProject"; payload: CreateProjectInput }
  | {
      id: string;
      at: string;
      type: "updateProject";
      payload: { id: string; patch: Partial<Pick<Project, "name" | "description" | "color">> };
    }
  | { id: string; at: string; type: "deleteProject"; payload: { id: string } }
  | { id: string; at: string; type: "createIssue"; payload: CreateIssueInput }
  | { id: string; at: string; type: "updateIssue"; payload: { id: string; patch: UpdateIssueInput } }
  | { id: string; at: string; type: "deleteIssue"; payload: { id: string } }
  | {
      id: string;
      at: string;
      type: "moveIssue";
      payload: { issueId: string; toColumnId: string; beforeIssueId?: string | null };
    }
  | { id: string; at: string; type: "resetDemo"; payload: { ownerId: string; workspace: Workspace } };

export function makeOp<T extends Op["type"]>(
  type: T,
  payload: Extract<Op, { type: T }>["payload"]
): Extract<Op, { type: T }> {
  return {
    id: uid("op"),
    at: new Date().toISOString(),
    type,
    payload,
  } as Extract<Op, { type: T }>;
}

function nextOrder(issues: Issue[], projectId: string, status: string) {
  const dest = issues.filter((issue) => issue.projectId === projectId && issue.status === status);
  if (dest.length === 0) return 0;
  return Math.max(...dest.map((issue) => issue.order)) + 1;
}

export function applyOp(state: Workspace, op: Op): Workspace {
  switch (op.type) {
    case "createProject": {
      const input = op.payload;
      const id = input.id ?? uid("proj");
      if (state.projects.some((project) => project.id === id)) return state;
      const key = (input.key || keyFromName(input.name)).slice(0, 5).toUpperCase();
      const createdAt = op.at;
      const project: Project = {
        id,
        name: input.name.trim(),
        key,
        description: input.description.trim(),
        color: input.color,
        createdAt,
        ownerId: input.ownerId,
        columns:
          input.columns && input.columns.length > 0
            ? input.columns
            : DEFAULT_COLUMNS.map((column) => ({
                id: uid("col"),
                name: column.name,
                wipLimit: column.wipLimit,
              })),
      };
      return { ...state, projects: [project, ...state.projects] };
    }
    case "updateProject":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === op.payload.id ? { ...project, ...op.payload.patch } : project
        ),
      };
    case "deleteProject":
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== op.payload.id),
        issues: state.issues.filter((issue) => issue.projectId !== op.payload.id),
      };
    case "createIssue": {
      const input = op.payload;
      const id = input.id ?? uid("issue");
      if (state.issues.some((issue) => issue.id === id)) return state;
      const project = state.projects.find((item) => item.id === input.projectId);
      if (!project) return state;
      const status = input.status ?? project.columns[0]?.id;
      if (!status) return state;
      const siblings = state.issues.filter((issue) => issue.projectId === input.projectId);
      const taken = new Set(siblings.map((issue) => issue.number));
      const requested = input.number;
      const number =
        requested && !taken.has(requested)
          ? requested
          : siblings.length === 0
            ? 1
            : Math.max(...siblings.map((issue) => issue.number)) + 1;
      const createdAt = op.at;
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
        order: nextOrder(state.issues, input.projectId, status),
        createdAt,
        updatedAt: createdAt,
      };
      return { ...state, issues: [...state.issues, issue] };
    }
    case "updateIssue":
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.id === op.payload.id
            ? {
                ...issue,
                ...op.payload.patch,
                title: op.payload.patch.title?.trim() ?? issue.title,
                description:
                  op.payload.patch.description !== undefined
                    ? op.payload.patch.description
                    : issue.description,
                updatedAt: op.at,
              }
            : issue
        ),
      };
    case "deleteIssue":
      return {
        ...state,
        issues: state.issues.filter((issue) => issue.id !== op.payload.id),
      };
    case "moveIssue": {
      const { issueId, toColumnId, beforeIssueId } = op.payload;
      const issue = state.issues.find((item) => item.id === issueId);
      if (!issue) return state;
      const siblings = state.issues
        .filter(
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

      return {
        ...state,
        issues: state.issues.map((item) =>
          item.id === issueId
            ? { ...item, status: toColumnId, order, updatedAt: op.at }
            : item
        ),
      };
    }
    case "resetDemo": {
      const ownedIds = new Set(
        state.projects.filter((project) => project.ownerId === op.payload.ownerId).map((p) => p.id)
      );
      return {
        people: mergePeople(state.people, op.payload.workspace.people),
        labels: mergeLabels(state.labels, op.payload.workspace.labels),
        projects: [
          ...op.payload.workspace.projects,
          ...state.projects.filter((project) => !ownedIds.has(project.id)),
        ],
        issues: [
          ...op.payload.workspace.issues,
          ...state.issues.filter((issue) => !ownedIds.has(issue.projectId)),
        ],
      };
    }
    default:
      return state;
  }
}

function mergePeople(current: Workspace["people"], incoming: Workspace["people"]) {
  const map = new Map(current.map((person) => [person.id, person]));
  for (const person of incoming) map.set(person.id, person);
  return [...map.values()];
}

function mergeLabels(current: Workspace["labels"], incoming: Workspace["labels"]) {
  const map = new Map(current.map((label) => [label.id, label]));
  for (const label of incoming) map.set(label.id, label);
  return [...map.values()];
}

export function emptyWorkspace(): Workspace {
  return { people: [], labels: [], projects: [], issues: [] };
}
