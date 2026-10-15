import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

import type { SessionUser } from "@/lib/types";
import { publicUser, withDb } from "@/server/db";

const COOKIE = "ph_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function newSessionId() {
  return randomBytes(24).toString("hex");
}

export async function createSession(userId: string) {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
  await withDb((db) => {
    db.sessions = db.sessions.filter((session) => session.userId !== userId);
    db.sessions.push({ id, userId, expiresAt });
  });
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
  return id;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await withDb((db) => {
      db.sessions = db.sessions.filter((session) => session.id !== token);
    });
  }
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return withDb((db) => {
    const session = db.sessions.find((item) => item.id === token);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      db.sessions = db.sessions.filter((item) => item.id !== token);
      return null;
    }
    const user = db.users.find((item) => item.id === session.userId);
    return user ? publicUser(user) : null;
  });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
