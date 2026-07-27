import { ArticleCard } from "@/components/ArticleCard";
import { CategoryChips } from "@/components/CategoryChips";
import { EmptyState } from "@/components/EmptyState";
import { RecentFeed } from "@/components/RecentFeed";
import { categoryLabel, isValidCategory } from "@/lib/categories";
import { listPublished } from "@/lib/articles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = categoryLabel(slug);
  return {
    title: label,
    description: `Notícias de ${label} no LINHA DIREITA.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!isValidCategory(slug)) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const take = 12;
  const [{ items, total }, recent] = await Promise.all([
    listPublished({
      category: slug,
      take,
      skip: (page - 1) * take,
    }),
    listPublished({ take: 10 }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#009c3b]">Categoria</p>
      <h1 className="font-serif text-3xl text-white md:text-4xl">{categoryLabel(slug)}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {total} matéria{total === 1 ? "" : "s"}
      </p>
      <div className="mt-4">
        <CategoryChips active={slug} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {items.length === 0 ? (
            <EmptyState title={`Sem notícias em ${categoryLabel(slug)}`} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {items.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-4 text-sm text-zinc-400">
              {page > 1 ? (
                <a
                  href={`?page=${page - 1}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-white hover:border-[#009c3b]/40"
                >
                  ← Anterior
                </a>
              ) : null}
              <span>
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <a
                  href={`?page=${page + 1}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-white hover:border-[#009c3b]/40"
                >
                  Próxima →
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <RecentFeed articles={recent.items} title="Feed ao vivo" subtitle="Todas as categorias" />
      </div>
    </div>
  );
}
