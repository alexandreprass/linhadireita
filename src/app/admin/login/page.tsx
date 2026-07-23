"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha no login");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">Admin</p>
      <h1 className="font-serif text-3xl text-white">Entrar no painel</h1>
      <p className="mt-2 text-sm text-zinc-400">Acesso restrito ao administrador do LINHA DIREITA.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#141820] p-6">
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Usuário</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-red-500/50"
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-red-500/50"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
