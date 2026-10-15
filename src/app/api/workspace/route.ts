import { readDb, workspaceForUser } from "@/server/db";
import { getSessionUser, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to continue.", 401);
  const db = await readDb();
  const workspace = workspaceForUser(db, user.id);
  return Response.json({ user, workspace });
}
