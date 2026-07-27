import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminArticlesTable } from "./AdminArticlesTable";
import { CollectButton } from "./CollectButton";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [articles, jobs, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: { not: "deleted" } },
      // Mais recentes em cima
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.jobLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
    prisma.article.count({ where: { status: "published" } }),
  ]);

  const rows = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    sourceName: a.sourceName,
    featured: a.featured,
    status: a.status,
    isManual: a.isManual,
    publishedAt: formatDate(a.publishedAt),
    createdAt: formatDate(a.createdAt),
  }));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#009c3b]">Admin</p>
          <h1 className="font-serif text-3xl text-white">Painel LINHA DIREITA</h1>
          <p className="mt-2 text-sm text-zinc-400">{total} notícias publicadas</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/admin/nova"
              className="rounded-full bg-[#009c3b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00b347]"
            >
              + Nova notícia
            </Link>
            <LogoutButton />
          </div>
          <CollectButton />
        </div>
      </div>

      <p className="mb-6 text-xs text-zinc-500">
        Só reescreve matérias com data de <strong className="text-zinc-400">hoje (Brasília)</strong>.
        Duplicatas das últimas 24h são ignoradas. O botão vermelho redondo para todas as coletas.
        Datas no site usam horário de Brasília.
      </p>

      <AdminArticlesTable articles={rows} />

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
          Jobs recentes
        </h2>
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
            >
              <span className="font-medium text-white">{j.kind}</span>
              <span className="mx-2 text-zinc-600">·</span>
              <span
                className={
                  j.status === "ok"
                    ? "text-emerald-400"
                    : j.status === "error"
                      ? "text-red-400"
                      : j.status === "cancelled"
                        ? "text-orange-400"
                        : "text-amber-400"
                }
              >
                {j.status}
              </span>
              <p className="mt-1 text-xs text-zinc-500">{j.detail || "—"}</p>
              <p className="text-xs text-zinc-600">{formatDate(j.startedAt)}</p>
            </li>
          ))}
          {jobs.length === 0 ? <li className="text-sm text-zinc-500">Nenhum job ainda.</li> : null}
        </ul>
      </section>
    </div>
  );
}
