import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06090f]/90 backdrop-blur-2xl">
      <div className="brasil-stripe" />
      <div className="site-shell flex items-center gap-2 py-1.5 md:gap-3 md:py-2">
        <Link href="/" className="flex shrink-0 items-center transition hover:opacity-95">
          <Image
            src="/logo.png"
            alt="Linha Direita"
            width={320}
            height={112}
            className="h-10 w-auto object-contain drop-shadow-[0_0_16px_rgba(255,223,0,0.12)] md:h-12"
            priority
          />
        </Link>

        <nav className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto xl:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/busca"
            className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
          >
            Busca
          </Link>
        </nav>

        <div className="ml-auto w-[min(100%,200px)] shrink-0 sm:w-[220px] md:w-[240px]">
          <SearchBox compact />
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.02] xl:hidden">
        <div className="site-shell flex gap-1.5 overflow-x-auto py-1.5 scrollbar-none">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full border border-[#009c3b]/25 bg-[#009c3b]/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-200"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
