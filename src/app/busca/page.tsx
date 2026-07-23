import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBox } from "@/components/SearchBox";
import { listPublished } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q?.trim();
  return {
    title: q ? `Busca: ${q}` : "Buscar notícias",
    description: "Busque notícias no LINHA DIREITA por tema, pessoa ou palavra-chave.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const page = Math.max(1, Number(sp.page || 1));
  const take = 12;

  const { items, total } = q
    ? await listPublished({ q, take, skip: (page - 1) * take })
    : { items: [], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="max-w-4xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Busca</p>
      <h1 className="font-serif text-3xl text-white md:text-4xl">
        {q ? "Resultados" : "Buscar notícias"}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {q ? `${total} resultado${total === 1 ? "" : "s"} para “${q}”` : "Pesquise por tema, cidade ou palavra-chave."}
      </p>

      <div className="mt-6 max-w-lg">
        <SearchBox />
      </div>

      {!q ? (
        <div className="mt-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={`Nada encontrado para “${q}”`} description="Tente outra palavra-chave ou explore as categorias." />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-4 text-sm text-zinc-400">
              {page > 1 ? (
                <a
                  href={`/busca?q=${encodeURIComponent(q)}&page=${page - 1}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-white"
                >
                  ← Anterior
                </a>
              ) : null}
              <span>
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <a
                  href={`/busca?q=${encodeURIComponent(q)}&page=${page + 1}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-white"
                >
                  Próxima →
                </a>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
