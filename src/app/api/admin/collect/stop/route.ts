import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestStopCollection, isCollectRunning, getCollectStatus } = await import(
    "@/lib/collector"
  );

  if (!isCollectRunning()) {
    return NextResponse.json({
      ok: false,
      message: "Nenhuma coleta em andamento",
      collect: getCollectStatus(),
    });
  }

  requestStopCollection();
  return NextResponse.json({
    ok: true,
    message: "Parada solicitada. A coleta vai interromper após a notícia atual.",
    collect: getCollectStatus(),
  });
}
