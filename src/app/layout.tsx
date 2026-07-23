import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://linhadireita.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LINHA DIREITA — Notícias com clareza",
    template: "%s · LINHA DIREITA",
  },
  description:
    "Portal de notícias moderno com reescrita original via Grok. Política, Brasil, Mundo, Economia e mais — com destaque e categorias.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "LINHA DIREITA",
    title: "LINHA DIREITA — Notícias com clareza",
    description:
      "Notícias reescritas de forma original a partir de grandes veículos brasileiros.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LINHA DIREITA",
    description: "Notícias com clareza e reescrita original.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
