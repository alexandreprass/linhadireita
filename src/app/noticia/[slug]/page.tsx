import { ArticleCard } from "@/components/ArticleCard";
import { categoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { getBySlug, parseTags, relatedArticles } from "@/lib/articles";
import { getSourceById } from "@/lib/sources";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBySlug(slug);
  if (!article) return { title: "Notícia não encontrada" };
  return {
    title: article.title,
    description: article.lead || article.title,
    openGraph: {
      title: article.title,
      description: article.lead || article.title,
      type: "article",
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getBySlug(slug);
  if (!article) notFound();

  const related = await relatedArticles(article);
  const source = article.sourceId ? getSourceById(article.sourceId) : null;
  const tags = parseTags(article.tags);
  const paragraphs = article.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <Link
            href={`/categoria/${article.category}`}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300"
          >
            {categoryLabel(article.category)}
          </Link>
          <span>{article.sourceName || "Linha Direita"}</span>
          <span>·</span>
          <time>{formatDate(article.publishedAt)}</time>
        </div>
        <h1 className="font-serif text-3xl leading-tight tracking-tight text-white md:text-5xl">
          {article.title}
        </h1>
        {article.lead ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">{article.lead}</p>
        ) : null}
      </header>

      {article.imageUrl ? (
        <figure className="mb-8 overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt=""
            className="max-h-[460px] w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </figure>
      ) : null}

      <div className="prose-news max-w-2xl">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-red-500/10 to-white/[0.02] p-5">
        <p className="text-sm font-semibold text-white">Fonte original</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Matéria reescrita de forma original
          {article.sourceName ? (
            <>
              {" "}
              com base em conteúdo de <strong className="text-zinc-200">{article.sourceName}</strong>
            </>
          ) : null}
          . O texto acima não é cópia da reportagem.
        </p>
        {article.originalLink ? (
          <a
            href={article.originalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Ler na fonte original ↗
          </a>
        ) : null}
        {article.originalTitle ? (
          <p className="mt-3 text-xs text-zinc-500">
            Título original: <em>{article.originalTitle}</em>
          </p>
        ) : null}
        {source?.website ? (
          <p className="mt-1 text-xs text-zinc-500">
            Site da fonte:{" "}
            <a href={source.website} className="text-zinc-400 underline" target="_blank" rel="noopener noreferrer">
              {source.website}
            </a>
          </p>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t}>
              <Link
                href={`/busca?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:text-white"
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Relacionadas</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
