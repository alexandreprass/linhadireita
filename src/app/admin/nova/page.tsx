"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "politica",
  "eleicoes",
  "seguranca",
  "stf",
  "congresso",
  "eua",
  "economia",
  "brasil",
];

export default function NovaNoticiaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("politica");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [generateImage, setGenerateImage] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // se não autenticado, a API retorna 401
    setAuthChecked(true);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lead,
          body,
          category,
          tags,
          imageUrl: imageUrl || null,
          generateImage,
          featured,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Falha ao publicar");
        return;
      }
      router.push(`/noticia/${data.article.slug}`);
      router.refresh();
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#009c3b]">Admin</p>
          <h1 className="font-serif text-3xl text-white">Publicar notícia manual</h1>
        </div>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-[#141820] p-6">
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Título *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#009c3b]/50"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Lead / subtítulo</span>
          <input
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#009c3b]/50"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Corpo * (parágrafos separados por linha em branco)</span>
          <textarea
            required
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#009c3b]/50"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block text-zinc-400">Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-zinc-400">Tags (vírgula)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#009c3b]/50"
              placeholder="bolsonaro, economia"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">URL da imagem (opcional)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#009c3b]/50"
            placeholder="https://..."
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={generateImage} onChange={(e) => setGenerateImage(e.target.checked)} />
          Gerar imagem automaticamente se não houver URL
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Publicar como destaque da home
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#009c3b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#00b347] disabled:opacity-60"
        >
          {loading ? "Publicando..." : "Publicar agora"}
        </button>
      </form>
    </div>
  );
}
