import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function CategoryChips({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className={
              isActive
                ? "rounded-full border border-[#ffdf00]/50 bg-[#ffdf00]/15 px-3.5 py-1.5 text-xs font-semibold text-[#ffdf00] shadow-[0_0_20px_rgba(255,223,0,0.12)]"
                : "rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur transition hover:border-[#009c3b]/40 hover:text-white"
            }
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
