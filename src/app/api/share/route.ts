import { createShare, sharePreview, withDb } from "@/server/db";
import { getSessionUser, jsonError } from "@/server/session";
import type { ShareKind } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to continue.", 401);
  const body = (await request.json().catch(() => null)) as {
    kind?: ShareKind;
    targetId?: string;
  } | null;
  const kind = body?.kind;
  const targetId = body?.targetId?.trim() ?? "";
  if (kind !== "project" && kind !== "issue") return jsonError("Choose a project or issue to share.");
  if (!targetId) return jsonError("Missing share target.");

  const result = await withDb((db) => {
    const share = createShare(db, user.id, kind, targetId);
    if (!share) return null;
    return { token: share.token, share: sharePreview(db, share.token, user.id) };
  });
  if (!result) return jsonError("You can only share boards you can open.", 403);
  return Response.json(result);
}
