import Link from "next/link";

export function EmptyState({
  title = "Nenhuma notícia ainda",
  description = "A coleta automática roda periodicamente. Configure a XAI_API_KEY e dispare uma coleta no admin.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
      <h3 className="font-serif text-2xl text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{description}</p>
      <Link
        href="/admin"
        className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
      >
        Abrir painel admin
      </Link>
    </div>
  );
}
