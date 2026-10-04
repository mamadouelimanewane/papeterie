/**
 * Ajoute Product.barcode (+ index unique) sur la base utilisee par l'import
 * (POSTGRES_PRISMA_URL, sinon DATABASE_URL). Equivalent de `prisma db push` pour ce seul changement,
 * utile quand le moteur de schema Prisma n'arrive pas a joindre Neon (IPv6).
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/add-barcode-column.ts          -> affiche la base cible, n'ecrit rien
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/add-barcode-column.ts --apply  -> applique
 *
 * Les deux instructions sont idempotentes (IF NOT EXISTS) : on peut les rejouer sans risque.
 */
import pg from "pg"

const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL
if (!url) { console.error("POSTGRES_PRISMA_URL / DATABASE_URL absente"); process.exit(1) }
const apply = process.argv.includes("--apply")

async function main() {
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const host = new URL(url!).host
    const stores = await client.query('SELECT id, name FROM "Store" ORDER BY "createdAt" LIMIT 3')
    const products = await client.query('SELECT count(*)::int AS n FROM "Product"')
    const col = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'barcode'`)
    console.log(`Base cible : ${host}`)
    console.log(`Boutiques  : ${stores.rows.map((s) => `${s.name} (${s.id})`).join(", ") || "aucune"}`)
    console.log(`Produits   : ${products.rows[0].n}`)
    console.log(`Colonne barcode : ${col.rowCount ? "deja presente" : "absente"}`)

    if (!apply) { console.log("\nSIMULATION : rien n'a ete modifie. Ajouter --apply pour appliquer."); return }

    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT')
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode")')
    console.log("\nOK : colonne barcode et index unique en place.")
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
