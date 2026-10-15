import { initialsFromName, uid } from "@/lib/format";
import { personFromUser } from "@/lib/people";
import { PROJECT_COLORS } from "@/lib/seed";
import { withDb } from "@/server/db";
import { hashPassword } from "@/server/password";
import { createSession, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
  } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (name.length < 2) return jsonError("Name must be at least 2 characters.");
  if (!email.includes("@")) return jsonError("Enter a valid email.");
  if (password.length < 4) return jsonError("Password must be at least 4 characters.");

  const color = PROJECT_COLORS[Math.abs(hashCode(email)) % PROJECT_COLORS.length];
  const user = await withDb((db) => {
    if (db.users.some((item) => item.email === email)) return null;
    const created = {
      id: uid("user"),
      name,
      email,
      initials: initialsFromName(name),
      color,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    db.people.push(personFromUser(created));
    return created;
  });

  if (!user) return jsonError("An account with that email already exists.", 409);
  await createSession(user.id);
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      initials: user.initials,
      color: user.color,
    },
  });
}

function hashCode(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return hash;
}
