import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import { FeaturedHero } from "@/components/FeaturedHero";
import { CATEGORIES } from "@/lib/categories";
import { getFeaturedArticle, listPublished } from "@/lib/articles";
import { SOURCES } from "@/lib/sources";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedArticle();
  const { items } = await listPublished({
    take: 12,
    excludeId: featured?.id,
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Portal</p>
          <h1 className="font-serif text-3xl tracking-tight text-white md:text-4xl">
            O que está acontecendo agora
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400 md:text-base">
            Notícias reescritas com IA a partir de Jovem Pan, Revista Oeste, Gazeta do Povo, CNN Brasil e
            Metrópoles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.slice(0, 5).map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-red-500/40 hover:text-white"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {featured ? <FeaturedHero article={featured} /> : <EmptyState />}

      {items.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Últimas notícias</h2>
            <Link href="/busca" className="text-sm text-red-400 hover:text-red-300">
              Buscar →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </>
      ) : null}

      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Fontes monitoradas</h2>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <Link
              key={s.id}
              href={`/fonte/${s.slug}`}
              className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5"
              style={{ borderColor: `${s.color}55` }}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
