import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoUserId } from "@/lib/demo";
import { initialsFromName } from "@/lib/format";
import { applyOp, type Op } from "@/lib/ops";
import { personFromUser } from "@/lib/people";
import { createSeedWorkspace } from "@/lib/seed";
import type {
  Issue,
  Label,
  Person,
  Project,
  SessionUser,
  SharePreview,
  Workspace,
} from "@/lib/types";
import { hashPassword } from "@/server/password";

export type DbUser = SessionUser & {
  passwordHash: string;
  createdAt: string;
};

export type DbSession = {
  id: string;
  userId: string;
  expiresAt: string;
};

export type DbMember = {
  projectId: string;
  userId: string;
  role: "owner" | "member";
};

export type DbShare = {
  token: string;
  kind: "project" | "issue";
  targetId: string;
  createdBy: string;
  createdAt: string;
};

export type Database = {
  users: DbUser[];
  sessions: DbSession[];
  members: DbMember[];
  shares: DbShare[];
  people: Person[];
  labels: Label[];
  projects: Project[];
  issues: Issue[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "project-hub.json");

export { DEMO_ACCOUNTS, isDemoUserId };

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function emptyDb(): Database {
  return {
    users: [],
    sessions: [],
    members: [],
    shares: [],
    people: [],
    labels: [],
    projects: [],
    issues: [],
  };
}

function seedDb(): Database {
  const workspace = createSeedWorkspace();
  const createdAt = new Date().toISOString();
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const users: DbUser[] = DEMO_ACCOUNTS.map((account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    initials: initialsFromName(account.name),
    color: account.color,
    passwordHash,
    createdAt,
  }));
  const members: DbMember[] = workspace.projects.flatMap((project) =>
    users.map((user) => ({
      projectId: project.id,
      userId: user.id,
      role: user.id === project.ownerId ? "owner" : "member",
    }))
  );
  return {
    users,
    sessions: [],
    members,
    shares: [],
    people: workspace.people,
    labels: workspace.labels,
    projects: workspace.projects,
    issues: workspace.issues,
  };
}

async function readFileDb(): Promise<Database> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (!parsed.users?.length) return seedDb();
    return {
      ...emptyDb(),
      ...parsed,
    };
  } catch {
    const seeded = seedDb();
    await writeFileDb(seeded);
    return seeded;
  }
}

async function writeFileDb(db: Database) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DATA_FILE);
}

export function withDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const db = await readFileDb();
    const result = await fn(db);
    await writeFileDb(db);
    return result;
  });
}

export function readDb(): Promise<Database> {
  return enqueue(() => readFileDb());
}

export function publicUser(user: DbUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: user.initials,
    color: user.color,
  };
}

export function workspaceForUser(db: Database, userId: string): Workspace {
  const projectIds = new Set(
    db.members.filter((member) => member.userId === userId).map((member) => member.projectId)
  );
  const projects = db.projects.filter((project) => projectIds.has(project.id));
  const issues = db.issues.filter((issue) => projectIds.has(issue.projectId));
  const memberIds = new Set(
    db.members.filter((member) => projectIds.has(member.projectId)).map((member) => member.userId)
  );
  const peopleMap = new Map(db.people.map((person) => [person.id, person]));
  for (const user of db.users) {
    if (memberIds.has(user.id) || user.id === userId) {
      const demo = DEMO_ACCOUNTS.find((account) => account.id === user.id);
      peopleMap.set(user.id, personFromUser(user, demo?.role ?? "Member"));
    }
  }
  return {
    people: [...peopleMap.values()],
    labels: db.labels,
    projects,
    issues,
  };
}

export function writeWorkspaceSlice(db: Database, previous: Workspace, next: Workspace) {
  const prevProjectIds = new Set(previous.projects.map((project) => project.id));
  const nextProjectIds = new Set(next.projects.map((project) => project.id));
  const prevIssueIds = new Set(previous.issues.map((issue) => issue.id));
  const nextIssueIds = new Set(next.issues.map((issue) => issue.id));

  db.projects = [
    ...db.projects.filter((project) => !prevProjectIds.has(project.id)),
    ...next.projects,
  ];
  db.issues = [
    ...db.issues.filter((issue) => !prevIssueIds.has(issue.id)),
    ...next.issues,
  ];
  db.people = mergeById(db.people, next.people);
  db.labels = mergeById(db.labels, next.labels);

  for (const id of prevProjectIds) {
    if (!nextProjectIds.has(id)) {
      db.members = db.members.filter((member) => member.projectId !== id);
      db.shares = db.shares.filter(
        (share) => !(share.kind === "project" && share.targetId === id)
      );
    }
  }
  for (const id of prevIssueIds) {
    if (!nextIssueIds.has(id)) {
      db.shares = db.shares.filter(
        (share) => !(share.kind === "issue" && share.targetId === id)
      );
    }
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

function isMember(db: Database, userId: string, projectId: string) {
  return db.members.some((member) => member.userId === userId && member.projectId === projectId);
}

function projectIdForOp(workspace: Workspace, op: Op): string | null {
  switch (op.type) {
    case "createProject":
    case "resetDemo":
      return null;
    case "updateProject":
    case "deleteProject":
      return op.payload.id;
    case "createIssue":
      return op.payload.projectId;
    case "updateIssue":
    case "deleteIssue":
      return workspace.issues.find((issue) => issue.id === op.payload.id)?.projectId ?? null;
    case "moveIssue":
      return workspace.issues.find((issue) => issue.id === op.payload.issueId)?.projectId ?? null;
    default:
      return null;
  }
}

function restoreDemoMemberships(db: Database) {
  const seed = createSeedWorkspace();
  for (const project of seed.projects) {
    for (const account of DEMO_ACCOUNTS) {
      const exists = db.members.some(
        (member) => member.projectId === project.id && member.userId === account.id
      );
      if (!exists) {
        db.members.push({
          projectId: project.id,
          userId: account.id,
          role: account.id === project.ownerId ? "owner" : "member",
        });
      }
    }
  }
}

export function applyUserOps(db: Database, userId: string, ops: Op[]) {
  const previous = workspaceForUser(db, userId);
  let workspace = previous;
  const applied: string[] = [];

  for (const op of ops) {
    if (op.type === "resetDemo") {
      if (!isDemoUserId(userId)) {
        applied.push(op.id);
        continue;
      }
      workspace = applyOp(workspace, {
        ...op,
        payload: { ownerId: userId, workspace: createSeedWorkspace() },
      });
      applied.push(op.id);
      continue;
    }

    const normalized: Op =
      op.type === "createProject"
        ? { ...op, payload: { ...op.payload, ownerId: userId } }
        : op;

    const projectId = projectIdForOp(workspace, normalized);
    if (projectId && !isMember(db, userId, projectId)) {
      applied.push(op.id);
      continue;
    }
    if (normalized.type !== "createProject" && projectId === null) {
      const missingIssue =
        normalized.type === "updateIssue" ||
        normalized.type === "deleteIssue" ||
        normalized.type === "moveIssue";
      if (missingIssue) {
        applied.push(op.id);
        continue;
      }
    }

    const beforeIds = new Set(workspace.projects.map((project) => project.id));
    workspace = applyOp(workspace, normalized);

    if (normalized.type === "createProject") {
      const created = workspace.projects.find((project) => !beforeIds.has(project.id));
      const id = created?.id ?? normalized.payload.id;
      if (id && !isMember(db, userId, id)) {
        db.members.push({ projectId: id, userId, role: "owner" });
      }
    }

    applied.push(op.id);
  }

  writeWorkspaceSlice(db, previous, workspace);
  if (ops.some((op) => op.type === "resetDemo") && isDemoUserId(userId)) {
    restoreDemoMemberships(db);
  }
  return { applied, workspace: workspaceForUser(db, userId) };
}

export function sharePreview(
  db: Database,
  token: string,
  userId?: string | null
): SharePreview | null {
  const share = db.shares.find((item) => item.token === token);
  if (!share) return null;

  if (share.kind === "project") {
    const project = db.projects.find((item) => item.id === share.targetId);
    if (!project) return null;
    return {
      token,
      kind: "project",
      projectId: project.id,
      projectName: project.name,
      projectKey: project.key,
      alreadyMember: userId ? isMember(db, userId, project.id) : false,
    };
  }

  const issue = db.issues.find((item) => item.id === share.targetId);
  if (!issue) return null;
  const project = db.projects.find((item) => item.id === issue.projectId);
  if (!project) return null;
  return {
    token,
    kind: "issue",
    projectId: project.id,
    projectName: project.name,
    projectKey: project.key,
    issueId: issue.id,
    issueTitle: issue.title,
    issueNumber: issue.number,
    alreadyMember: userId ? isMember(db, userId, project.id) : false,
  };
}

export function createShare(
  db: Database,
  userId: string,
  kind: "project" | "issue",
  targetId: string
) {
  const projectId =
    kind === "project"
      ? targetId
      : db.issues.find((issue) => issue.id === targetId)?.projectId;
  if (!projectId || !isMember(db, userId, projectId)) return null;
  if (kind === "project" && !db.projects.some((project) => project.id === targetId)) return null;
  if (kind === "issue" && !db.issues.some((issue) => issue.id === targetId)) return null;

  const existing = db.shares.find(
    (share) => share.kind === kind && share.targetId === targetId && share.createdBy === userId
  );
  if (existing) return existing;

  const share = {
    token: randomBytes(12).toString("base64url"),
    kind,
    targetId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
  db.shares.push(share);
  return share;
}

export function joinShare(db: Database, userId: string, token: string): SharePreview | null {
  const preview = sharePreview(db, token, userId);
  if (!preview) return null;
  if (!isMember(db, userId, preview.projectId)) {
    db.members.push({
      projectId: preview.projectId,
      userId,
      role: "member",
    });
  }
  const user = db.users.find((item) => item.id === userId);
  if (user && !db.people.some((person) => person.id === userId)) {
    db.people.push(personFromUser(user));
  }
  return sharePreview(db, token, userId);
}

