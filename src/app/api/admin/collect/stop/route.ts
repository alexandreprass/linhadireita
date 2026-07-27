import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

/** Para todas as coletas ativas (manual, cron residual, etc.). */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestStopCollection, getCollectStatus } = await import("@/lib/collector");
  const result = await requestStopCollection();
  const collect = getCollectStatus();

  const message = result.wasRunning
    ? `Parada enviada. ${result.jobsCancelled} job(s) marcado(s). A coleta encerra após a etapa atual.`
    : result.jobsCancelled > 0
      ? `Nenhum loop em memória, mas ${result.jobsCancelled} job(s) pendente(s) foram cancelados.`
      : "Nenhuma coleta ativa no momento.";

  return NextResponse.json({
    ok: true,
    ...result,
    message,
    collect,
  });
}
