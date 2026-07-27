import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06090f]/92 backdrop-blur-2xl">
      <div className="brasil-stripe" />
      {/*
        Logo grande + header justo:
        altura fixa generosa para o logo; padding zero — o header não fica “vazio”.
      */}
      <div className="site-shell flex h-[72px] items-center gap-3 md:h-[88px] md:gap-4 lg:h-[96px]">
        <Link
          href="/"
          className="flex h-[85%] shrink-0 items-center leading-none transition hover:opacity-95"
        >
          <Image
            src="/logo.png"
            alt="Linha Direita"
            width={588}
            height={424}
            className="h-full w-auto max-w-[200px] object-contain object-left drop-shadow-[0_0_20px_rgba(255,223,0,0.16)] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px]"
            priority
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium leading-none text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/busca"
            className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium leading-none text-zinc-300 transition hover:bg-white/5 hover:text-[#ffdf00]"
          >
            Busca
          </Link>
        </nav>

        <div className="ml-auto w-[min(100%,180px)] shrink-0 sm:w-[200px] md:w-[240px]">
          <SearchBox compact />
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.02] xl:hidden">
        <div className="site-shell flex h-8 items-center gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="shrink-0 rounded-full border border-[#009c3b]/25 bg-[#009c3b]/10 px-2.5 py-0.5 text-[11px] font-medium leading-none text-zinc-200"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
