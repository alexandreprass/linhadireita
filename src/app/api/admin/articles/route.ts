import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.article.findMany({
    where: { status: { not: "deleted" } },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Dispara coleta manual
  const { runCollectionCycle, isCollectRunning } = await import("@/lib/collector");
  if (isCollectRunning()) {
    return NextResponse.json({ ok: false, message: "Coleta já em andamento" }, { status: 409 });
  }
  const max = Number(req.nextUrl.searchParams.get("max") || 6);
  const result = await runCollectionCycle(max);
  return NextResponse.json(result);
}
