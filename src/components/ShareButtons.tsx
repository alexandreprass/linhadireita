"use client";

import { useState } from "react";

type Props = {
  url: string;
  title: string;
  lead?: string | null;
};

export function ShareButtons({ url, title, lead }: Props) {
  const [copied, setCopied] = useState(false);
  const text = lead ? `${title} — ${lead}` : title;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const xHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  async function shareInstagram() {
    // Instagram web não tem share de URL nativo: copia o link e abre o app/site
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  const btnClass =
    "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-[#009c3b]/40 hover:bg-white/10 hover:text-white";

  return (
    <div className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
        Compartilhar
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Compartilhar no X"
        >
          <XIcon />
          X
        </a>
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Compartilhar no Facebook"
        >
          <FacebookIcon />
          Facebook
        </a>
        <button type="button" onClick={shareInstagram} className={btnClass} aria-label="Compartilhar no Instagram">
          <InstagramIcon />
          Instagram
        </button>
        <button type="button" onClick={copyLink} className={btnClass} aria-label="Copiar link">
          <LinkIcon />
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>
      {copied ? (
        <p className="mt-2 text-xs text-[#009c3b]">
          Link copiado. No Instagram, cole na bio, stories ou DM.
        </p>
      ) : null}
    </div>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.725-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
