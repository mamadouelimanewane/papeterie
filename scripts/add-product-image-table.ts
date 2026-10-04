/**
 * Cree la table "ProductImage" (photos produits televersees depuis le back-office) sur la base utilisee par
 * l'import (POSTGRES_PRISMA_URL, sinon DATABASE_URL). Equivalent de `prisma db push` pour cette seule table.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/add-product-image-table.ts          -> simulation
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/add-product-image-table.ts --apply  -> applique
 *
 * Idempotent (IF NOT EXISTS) : rejouable sans risque.
 */
import pg from "pg"

const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL
if (!url) { console.error("POSTGRES_PRISMA_URL / DATABASE_URL absente"); process.exit(1) }
const apply = process.argv.includes("--apply")

async function main() {
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const exists = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'ProductImage'`)
    const stores = await client.query('SELECT id, name FROM "Store" ORDER BY "createdAt" LIMIT 3')
    console.log(`Base cible : ${new URL(url!).host}`)
    console.log(`Boutiques  : ${stores.rows.map((s) => `${s.name} (${s.id})`).join(", ") || "aucune"}`)
    console.log(`Table ProductImage : ${exists.rowCount ? "deja presente" : "absente"}`)
    if (!apply) { console.log("\nSIMULATION : rien n'a ete modifie. Ajouter --apply pour appliquer."); return }

    await client.query(`CREATE TABLE IF NOT EXISTS "ProductImage" (
      "id" TEXT NOT NULL,
      "mime" TEXT NOT NULL,
      "data" BYTEA NOT NULL,
      "size" INTEGER NOT NULL,
      "storeId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
    )`)
    console.log("\nOK : table ProductImage en place.")
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
