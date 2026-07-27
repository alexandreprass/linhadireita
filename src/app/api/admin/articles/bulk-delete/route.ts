import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Nenhum id informado" }, { status: 400 });
  }

  const result = await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: { status: "deleted", featured: false },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
