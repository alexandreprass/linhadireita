"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminActions } from "./AdminActions";

export type AdminArticleRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  sourceName: string | null;
  featured: boolean;
  status: string;
  isManual: boolean;
  publishedAt: string;
  createdAt: string;
};

export function AdminArticlesTable({
  articles,
}: {
  articles: AdminArticleRow[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allIds = useMemo(() => articles.map((a) => a.id), [articles]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Apagar ${selected.size} notícia(s) selecionada(s)?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/articles/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Falha ao apagar");
        return;
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={bulkDelete}
          disabled={busy || selected.size === 0}
          className="rounded-full border border-red-500/40 bg-red-600/20 px-4 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-600/30 disabled:opacity-40"
        >
          Apagar selecionadas ({selected.size})
        </button>
        {selected.size > 0 ? (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Limpar seleção
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todas"
                  className="h-4 w-4 accent-red-500"
                />
              </th>
              <th className="px-4 py-3">Título</th>
              <th className="hidden px-4 py-3 md:table-cell">Categoria</th>
              <th className="hidden px-4 py-3 lg:table-cell">Fonte</th>
              <th className="hidden px-4 py-3 sm:table-cell">Data (Brasília)</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                    aria-label={`Selecionar ${a.title}`}
                    className="h-4 w-4 accent-red-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/noticia/${a.slug}`} className="font-medium text-white hover:text-[#ffdf00]">
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
                <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">{a.publishedAt}</td>
                <td className="px-4 py-3">
                  <AdminActions id={a.id} featured={a.featured} />
                </td>
              </tr>
            ))}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Nenhuma notícia ainda. Use “Coletar agora” ou publique manualmente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
