"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
    >
      Sair
    </button>
  );
}
