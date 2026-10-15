import type { Op } from "@/lib/ops";
import { applyUserOps, withDb, workspaceForUser } from "@/server/db";
import { getSessionUser, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to continue.", 401);
  const body = (await request.json().catch(() => null)) as { ops?: Op[] } | null;
  const ops = Array.isArray(body?.ops) ? body.ops : [];
  if (ops.length === 0) {
    const workspace = await withDb((db) => workspaceForUser(db, user.id));
    return Response.json({ workspace, applied: [] as string[] });
  }

  const result = await withDb((db) => applyUserOps(db, user.id, ops));
  return Response.json(result);
}
