import { clearSession } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}
