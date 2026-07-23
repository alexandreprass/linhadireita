export function EmptyState({
  title = "Nenhuma notícia no momento",
  description = "Em breve novas matérias serão publicadas. Volte em instantes.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
      <h3 className="font-serif text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
