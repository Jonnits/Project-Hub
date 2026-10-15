import type { Op } from "@/lib/ops";
import type { SessionUser, Workspace } from "@/lib/types";

const SESSION_KEY = "project-hub-session";

function cacheKey(userId: string) {
  return `project-hub-cache:${userId}`;
}

function outboxKey(userId: string) {
  return `project-hub-outbox:${userId}`;
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode can reject storage writes.
  }
}

export function readCache(userId: string): Workspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Workspace;
    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.issues)) return null;
    return {
      people: parsed.people ?? [],
      labels: parsed.labels ?? [],
      projects: parsed.projects,
      issues: parsed.issues,
    };
  } catch {
    return null;
  }
}

export function writeCache(userId: string, workspace: Workspace) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      cacheKey(userId),
      JSON.stringify({
        people: workspace.people,
        labels: workspace.labels,
        projects: workspace.projects,
        issues: workspace.issues,
      })
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readOutbox(userId: string): Op[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(outboxKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Op[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId: string, ops: Op[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(outboxKey(userId), JSON.stringify(ops));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
