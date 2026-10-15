import { joinShare, withDb } from "@/server/db";
import { getSessionUser, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to continue.", 401);
  const { token } = await params;
  const preview = await withDb((db) => joinShare(db, user.id, token));
  if (!preview) return jsonError("This invite is not valid.", 404);
  return Response.json(preview);
}
