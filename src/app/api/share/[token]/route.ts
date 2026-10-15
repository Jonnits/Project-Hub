import { readDb, sharePreview } from "@/server/db";
import { getSessionUser, jsonError } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getSessionUser();
  const db = await readDb();
  const preview = sharePreview(db, token, user?.id);
  if (!preview) return jsonError("This invite is not valid.", 404);
  return Response.json(preview);
}
