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
  ownerId: string;
  columns: Column[];
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
};

export type SyncStatus = "offline" | "pending" | "syncing" | "saved" | "error";

export type ShareKind = "project" | "issue";

export type SharePreview = {
  token: string;
  kind: ShareKind;
  projectId: string;
  projectName: string;
  projectKey: string;
  issueId?: string;
  issueTitle?: string;
  issueNumber?: number;
  alreadyMember: boolean;
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
