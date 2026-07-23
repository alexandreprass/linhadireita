import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminActions } from "./AdminActions";
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
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    prisma.jobLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
    prisma.article.count({ where: { status: "published" } }),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Admin</p>
          <h1 className="font-serif text-3xl text-white">Painel LINHA DIREITA</h1>
          <p className="mt-2 text-sm text-zinc-400">{total} notícias publicadas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/nova"
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            + Nova notícia
          </Link>
          <CollectButton />
          <LogoutButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="hidden px-4 py-3 md:table-cell">Categoria</th>
              <th className="hidden px-4 py-3 lg:table-cell">Fonte</th>
              <th className="hidden px-4 py-3 sm:table-cell">Data</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/noticia/${a.slug}`} className="font-medium text-white hover:text-red-300">
                      {a.featured ? "⭐ " : ""}
                      {a.title}
                    </Link>
                    <span className="text-xs text-zinc-500">
                      {a.isManual ? "manual" : "auto"} · {a.status}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">{a.category}</td>
                <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">{a.sourceName}</td>
                <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">{formatDate(a.publishedAt)}</td>
                <td className="px-4 py-3">
                  <AdminActions id={a.id} featured={a.featured} />
                </td>
              </tr>
            ))}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Nenhuma notícia ainda. Use “Coletar agora” ou publique manualmente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Jobs recentes</h2>
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
              <span className="font-medium text-white">{j.kind}</span>
              <span className="mx-2 text-zinc-600">·</span>
              <span className={j.status === "ok" ? "text-emerald-400" : j.status === "error" ? "text-red-400" : "text-amber-400"}>
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
