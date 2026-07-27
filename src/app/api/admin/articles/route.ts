import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getCollectStatus } = await import("@/lib/collector");
  const collect = getCollectStatus();

  // Polling leve do status da coleta
  if (req.nextUrl.searchParams.get("status") === "1") {
    return NextResponse.json({ collect });
  }

  const items = await prisma.article.findMany({
    where: { status: { not: "deleted" } },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ items, collect });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runCollectionCycle, isCollectRunning, getCollectStatus } = await import(
    "@/lib/collector"
  );

  if (isCollectRunning()) {
    return NextResponse.json(
      { ok: false, message: "Coleta já em andamento", collect: getCollectStatus() },
      { status: 409 }
    );
  }

  const max = Number(req.nextUrl.searchParams.get("max") || 50);

  // Background: permite chamar "Parar" em outra requisição enquanto roda
  void runCollectionCycle({
    maxRewrite: max,
    ignoreHourLimit: true,
  }).catch((err) => {
    console.error("[admin/collect] erro em background:", err);
  });

  return NextResponse.json({
    ok: true,
    started: true,
    message: `Coleta iniciada (até ${max} notícia(s)). Use Parar para interromper.`,
    collect: getCollectStatus(),
  });
}
