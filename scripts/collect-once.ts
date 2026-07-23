/**
 * Roda um ciclo de coleta fora do Next (útil localmente).
 * Uso: npx tsx scripts/collect-once.ts
 */
import "dotenv/config";
import { runCollectionCycle } from "../src/lib/collector";

async function main() {
  const result = await runCollectionCycle(Number(process.env.MAX_REWRITE_PER_CYCLE || 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
