"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { readJsonSafe } from "@/lib/safeJson";

type JobPayload = {
  status: "running" | "ok" | "error";
  message: string;
  error?: string;
  usedOriginalImage?: boolean;
  article?: { id: string; slug: string; title: string };
};

export function RewriteUrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [useSameImage, setUseSameImage] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollJob(jobId: string) {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/rewrite-url?jobId=${encodeURIComponent(jobId)}`);
        const data = await readJsonSafe<{ ok?: boolean; job?: JobPayload; error?: string }>(res);
        if (!res.ok || !data.job) {
          stopPoll();
          setLoading(false);
          setError(data.error || "Não foi possível ler o status do job");
          setMsg("");
          return;
        }
        const job = data.job;
        setMsg(job.message || "Processando…");

        if (job.status === "running") return;

        stopPoll();
        setLoading(false);

        if (job.status === "ok") {
          setError("");
          setMsg(
            `Publicada: “${job.article?.title || "sem título"}”` +
              (job.usedOriginalImage ? " (imagem original)" : " (imagem gerada)")
          );
          setUrl("");
          router.refresh();
        } else {
          setError(job.error || "Falha na reescrita");
          setMsg("");
        }
      } catch (err) {
        // não para no primeiro erro de rede transitório
        console.warn("[rewrite poll]", err);
      }
    }, 2000);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("Iniciando…");
    stopPoll();

    try {
      const res = await fetch("/api/admin/rewrite-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, useSameImage, featured }),
      });
      const data = await readJsonSafe<{
        ok?: boolean;
        jobId?: string;
        message?: string;
        error?: string;
      }>(res);

      if (!res.ok || !data.jobId) {
        setError(data.error || data.message || "Falha ao iniciar");
        setMsg("");
        setLoading(false);
        return;
      }

      setMsg(data.message || "Reescrita em andamento…");
      await pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMsg("");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-[#0f1520] p-5 shadow-lg shadow-black/20"
    >
      <div className="mb-3">
        <h2 className="text-sm font-bold text-white">Reescrever a partir de um link</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cole a URL. O processo roda em segundo plano (evita timeout no Render).
        </p>
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
              Marcado = imagem original. Desmarcado = gera com a IA.
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
        {loading ? "Processando…" : "Reescrever e publicar"}
      </button>

      {msg ? <p className="mt-3 text-sm text-[#7dffb0]">{msg}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
