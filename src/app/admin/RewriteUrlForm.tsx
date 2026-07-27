"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function RewriteUrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [useSameImage, setUseSameImage] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("Lendo a matéria e reescrevendo… isso pode levar 1–2 minutos.");
    try {
      const res = await fetch("/api/admin/rewrite-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, useSameImage, featured }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao reescrever");
        setMsg("");
        return;
      }
      setMsg(
        `Publicada: “${data.article?.title}”` +
          (data.usedOriginalImage ? " (imagem original)" : " (imagem gerada)")
      );
      setUrl("");
      router.refresh();
      if (data.article?.slug) {
        // opcional: abrir em nova aba
      }
    } catch (err) {
      setError(String(err));
      setMsg("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-[#0f1520] p-5 shadow-lg shadow-black/20"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white">Reescrever a partir de um link</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Cole a URL de uma matéria. O site extrai o texto, reescreve com a IA e publica.
          </p>
        </div>
      </div>

      <label className="mb-3 block text-sm">
        <span className="mb-1.5 block text-zinc-400">Link da notícia</span>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com/noticia/..."
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none placeholder:text-zinc-600 focus:border-[#009c3b]/50 disabled:opacity-60"
        />
      </label>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={useSameImage}
            onChange={(e) => setUseSameImage(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-[#009c3b]"
          />
          <span>
            <strong className="text-white">Usar mesma imagem</strong>
            <span className="block text-xs text-zinc-500">
              Marcado = imagem da matéria original. Desmarcado = gera imagem com a IA.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 accent-[#ffdf00]"
          />
          Publicar como destaque
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="rounded-full bg-[#009c3b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00b347] disabled:opacity-50"
      >
        {loading ? "Reescrevendo…" : "Reescrever e publicar"}
      </button>

      {msg ? <p className="mt-3 text-sm text-[#7dffb0]">{msg}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
