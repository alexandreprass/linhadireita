import { NextRequest, NextResponse } from "next/server";
import { isCollectRunning, runCollectionCycle } from "@/lib/collector";

/**
 * Worker HTTP para coleta periódica (Render Cron / externo).
 * Protegido por CRON_SECRET no header Authorization: Bearer <secret>
 * ou query ?secret=
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const q = req.nextUrl.searchParams.get("secret") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : q;

  if (secret && token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (isCollectRunning()) {
    return NextResponse.json({ ok: false, message: "Coleta já em andamento" }, { status: 409 });
  }

  const max = Number(req.nextUrl.searchParams.get("max") || process.env.MAX_REWRITE_PER_CYCLE || 8);
  const result = await runCollectionCycle(max);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
