import { createHash } from "crypto";

/** Gera slug URL-friendly a partir do título. */
export function slugify(text: string, maxLen = 80): string {
  const value = (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)
    .replace(/-$/, "");
  return value || "noticia";
}

/** Slug único com hash curto do link/título. */
export function uniqueSlug(title: string, key: string): string {
  const base = slugify(title);
  const digest = createHash("sha1").update(key).digest("hex").slice(0, 8);
  return `${base}-${digest}`;
}
