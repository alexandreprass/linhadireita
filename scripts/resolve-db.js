/**
 * Ajusta o provider do Prisma conforme DATABASE_URL:
 * - postgres/postgresql → provider = "postgresql" (Render, dados persistentes)
 * - file: ou vazio → provider = "sqlite" (local)
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");
const url = (process.env.DATABASE_URL || "").trim();

const isPostgres =
  url.startsWith("postgresql://") ||
  url.startsWith("postgres://") ||
  url.includes("postgres.render.com") ||
  process.env.USE_POSTGRES === "1";

const provider = isPostgres ? "postgresql" : "sqlite";

schema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`
);

// Garante url = env("DATABASE_URL")
if (!schema.includes('url      = env("DATABASE_URL")') && !schema.includes("url = env(\"DATABASE_URL\")")) {
  schema = schema.replace(
    /url\s*=\s*"[^"]+"/,
    'url      = env("DATABASE_URL")'
  );
}

fs.writeFileSync(schemaPath, schema);
console.log(`[resolve-db] Prisma provider = ${provider}`);
if (!url) {
  console.warn("[resolve-db] DATABASE_URL vazia — defina no .env (local: file:./linhadireita.db)");
}
