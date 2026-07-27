export function EmptyState({
  title = "Nenhuma notícia no momento",
  description = "Em breve novas matérias serão publicadas. Volte em instantes.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="glass-card rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#009c3b]/15 text-[#7dffb0]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-serif text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
