import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.article.update({
    where: { id },
    data: { status: "deleted", featured: false },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (body.featured === true) {
    await prisma.article.updateMany({ where: { featured: true }, data: { featured: false } });
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(typeof body.featured === "boolean" ? { featured: body.featured } : {}),
      ...(body.status ? { status: String(body.status) } : {}),
    },
  });
  return NextResponse.json({ ok: true, article });
}
