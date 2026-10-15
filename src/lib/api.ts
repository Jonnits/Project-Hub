import type { Op } from "@/lib/ops";
import type { SessionUser, ShareKind, SharePreview, Workspace } from "@/lib/types";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export async function apiRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ user?: SessionUser; error?: string }>(response);
  if (!response.ok || !data.user) throw new Error(data.error ?? "Could not create the account.");
  return data.user;
}

export async function apiLogin(input: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ user?: SessionUser; error?: string }>(response);
  if (!response.ok || !data.user) throw new Error(data.error ?? "Could not sign in.");
  return data.user;
}

export async function apiLogout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

export async function apiMe(): Promise<SessionUser | null> {
  try {
    const response = await fetch("/api/auth/me");
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("offline");
    const data = await readJson<{ user?: SessionUser | null }>(response);
    return data.user ?? null;
  } catch {
    throw new Error("offline");
  }
}

export async function apiWorkspace(): Promise<{ user: SessionUser; workspace: Workspace }> {
  const response = await fetch("/api/workspace");
  const data = await readJson<{ user?: SessionUser; workspace?: Workspace; error?: string }>(
    response
  );
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok || !data.workspace || !data.user) {
    throw new Error(data.error ?? "Could not load the workspace.");
  }
  return { user: data.user, workspace: data.workspace };
}

export async function apiSync(
  ops: Op[]
): Promise<{ user: SessionUser; workspace: Workspace; applied: string[] }> {
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ops }),
  });
  const data = await readJson<{
    user?: SessionUser;
    workspace?: Workspace;
    applied?: string[];
    error?: string;
  }>(response);
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok || !data.workspace || !data.user) {
    throw new Error(data.error ?? "Could not sync.");
  }
  return { user: data.user, workspace: data.workspace, applied: data.applied ?? [] };
}

export async function apiCreateShare(kind: ShareKind, targetId: string): Promise<string> {
  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, targetId }),
  });
  const data = await readJson<{ token?: string; error?: string }>(response);
  if (!response.ok || !data.token) throw new Error(data.error ?? "Could not create a share link.");
  return data.token;
}

export async function apiSharePreview(token: string): Promise<SharePreview> {
  const response = await fetch(`/api/share/${encodeURIComponent(token)}`);
  const data = await readJson<SharePreview & { error?: string }>(response);
  if (!response.ok) throw new Error(data.error ?? "This invite is not valid.");
  return data;
}

export async function apiJoinShare(token: string): Promise<SharePreview> {
  const response = await fetch(`/api/share/${encodeURIComponent(token)}/join`, {
    method: "POST",
  });
  const data = await readJson<SharePreview & { error?: string }>(response);
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok) throw new Error(data.error ?? "Could not join this board.");
  return data;
}
