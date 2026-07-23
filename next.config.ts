import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Evita bundling issues com pacotes nativos do Prisma em runtime Node
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
