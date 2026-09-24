export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Column = {
  id: string;
  name: string;
  wipLimit: number | null;
};

export type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  createdAt: string;
  columns: Column[];
};

export type Issue = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  assigneeId: string | null;
  labelIds: string[];
  storyPoints: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  people: Person[];
  labels: Label[];
  projects: Project[];
  issues: Issue[];
};
