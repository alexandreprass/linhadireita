import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatRelative } from "@/lib/format";

type Props = {
  article: {
    slug: string;
    title: string;
    lead?: string | null;
    category: string;
    sourceName?: string | null;
    imageUrl?: string | null;
    publishedAt: Date | string;
    sourceId?: string | null;
  };
};

export function ArticleCard({ article }: Props) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141820] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#181e2a]">
      <Link href={`/noticia/${article.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}
          <span className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {categoryLabel(article.category)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium text-zinc-400">{article.sourceName || "Linha Direita"}</span>
            <span>·</span>
            <time>{formatRelative(article.publishedAt)}</time>
          </div>
          <h3 className="line-clamp-3 text-[1.05rem] font-semibold leading-snug tracking-tight text-white">
            {article.title}
          </h3>
          {article.lead ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">{article.lead}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
