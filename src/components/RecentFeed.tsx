import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatRelative } from "@/lib/format";

export type FeedArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  imageUrl?: string | null;
  publishedAt: Date | string;
  lead?: string | null;
};

export function RecentFeed({
  articles,
  title = "Ao vivo",
  subtitle = "Últimas atualizações",
}: {
  articles: FeedArticle[];
  title?: string;
  subtitle?: string;
}) {
  if (!articles.length) {
    return (
      <aside className="feed-panel sticky top-20">
        <FeedHeader title={title} subtitle={subtitle} />
        <p className="px-4 pb-4 text-sm text-zinc-500">Nenhuma notícia recente ainda.</p>
      </aside>
    );
  }

  return (
    <aside className="feed-panel sticky top-20">
      <FeedHeader title={title} subtitle={subtitle} />
      <ul className="divide-y divide-white/[0.06]">
        {articles.map((a, i) => (
          <li key={a.id}>
            <Link
              href={`/noticia/${a.slug}`}
              className="group flex gap-3 px-4 py-3.5 transition hover:bg-white/[0.04]"
            >
              <div className="relative mt-0.5 flex w-6 shrink-0 flex-col items-center">
                <span className="feed-dot" />
                {i < articles.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-gradient-to-b from-[#009c3b]/50 to-transparent" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#009c3b]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7dffb0]">
                    {categoryLabel(a.category)}
                  </span>
                  <time className="text-[11px] text-zinc-500" title={formatDate(a.publishedAt)}>
                    {formatRelative(a.publishedAt)}
                  </time>
                </div>
                <p className="line-clamp-3 text-[13px] font-semibold leading-snug text-zinc-100 transition group-hover:text-[#ffdf00]">
                  {a.title}
                </p>
              </div>
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-[#002776] to-[#0b1a12] ring-1 ring-white/10" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/busca"
          className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-semibold text-zinc-300 transition hover:border-[#009c3b]/40 hover:text-white"
        >
          Ver todas as notícias →
        </Link>
      </div>
    </aside>
  );
}

function FeedHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
      <div>
        <div className="flex items-center gap-2">
          <span className="live-pulse" aria-hidden />
          <h2 className="text-sm font-bold tracking-tight text-white">{title}</h2>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}
