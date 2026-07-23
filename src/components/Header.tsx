import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0d12]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-red-600 via-rose-500 to-orange-500 text-sm font-bold tracking-tight text-white shadow-lg shadow-red-900/40">
            LD
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-white">LINHA DIREITA</span>
            <span className="block text-xs text-zinc-400">Notícias com clareza</span>
          </span>
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
          {CATEGORIES.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              {c.label}
            </Link>
          ))}
          <Link href="/busca" className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white">
            Busca
          </Link>
        </nav>

        <div className="ml-auto w-full sm:w-auto sm:min-w-[240px]">
          <SearchBox />
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 scrollbar-none lg:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
