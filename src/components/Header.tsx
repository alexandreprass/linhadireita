import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06090f]/85 backdrop-blur-2xl">
      <div className="brasil-stripe" />
      <div className="site-shell flex flex-wrap items-center gap-3 py-2 md:py-3">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-95">
          <Image
            src="/logo.png"
            alt="Linha Direita"
            width={640}
            height={224}
            className="h-40 w-auto max-h-[10rem] object-contain drop-shadow-[0_0_28px_rgba(255,223,0,0.14)] md:h-48 md:max-h-[12rem]"
            priority
          />
        </Link>

        <nav className="ml-1 hidden flex-1 items-center gap-0.5 xl:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="rounded-full px-2.5 py-1.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/busca"
            className="rounded-full px-2.5 py-1.5 text-[13px] font-medium text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
          >
            Busca
          </Link>
        </nav>

        <div className="ml-auto w-full sm:w-auto sm:min-w-[240px] sm:max-w-xs">
          <SearchBox />
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.02] xl:hidden">
        <div className="site-shell flex gap-2 overflow-x-auto py-2 scrollbar-none">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full border border-[#009c3b]/25 bg-[#009c3b]/10 px-3 py-1 text-xs font-medium text-zinc-200"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
