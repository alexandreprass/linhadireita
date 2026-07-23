import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { listPublished } from "@/lib/articles";
import { getSourceBySlug } from "@/lib/sources";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const source = getSourceBySlug(slug);
  return {
    title: source?.name || "Fonte",
    description: source ? `Notícias com base em ${source.name}.` : "Fonte de notícias",
  };
}

export default async function SourcePage({ params }: Props) {
  const { slug } = await params;
  const source = getSourceBySlug(slug);
  if (!source) notFound();

  const { items, total } = await listPublished({ sourceId: source.id, take: 24 });

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Fonte</p>
      <h1 className="font-serif text-3xl text-white md:text-4xl">{source.name}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {total} matéria{total === 1 ? "" : "s"} ·{" "}
        <a href={source.website} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300">
          site oficial ↗
        </a>
      </p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={`Sem notícias de ${source.name}`} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
