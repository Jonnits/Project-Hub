import { readDb } from "@/server/db";
import { verifyPassword } from "@/server/password";
import { createSession, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  const db = await readDb();
  const user = db.users.find((item) => item.email === email) ?? null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError("Email or password is wrong.", 401);
  }
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
