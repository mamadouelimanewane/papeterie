/**
 * Rattrapage : credite les boutiques (et les livreurs) pour les commandes DEJA livrees avant le correctif
 * « reglement a la livraison ». Pour chaque commande Delivered/Completed sans transaction VTE-<n° commande>,
 * applique le meme reglement que la livraison (articles - commission pour la boutique ; frais pour le livreur
 * s'il n'avait pas deja ete credite). Idempotent : rejouable sans risque.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/backfill-store-credits.ts          -> simulation
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/backfill-store-credits.ts --apply  -> applique
 */
import { prisma } from "../src/lib/prisma"
import { settleDeliveredOrder } from "../src/lib/delivery"

const apply = process.argv.includes("--apply")

async function main() {
  const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? ""
  console.log(`Base cible : ${url ? new URL(url).host : "?"}`)

  const delivered = await prisma.order.findMany({
    where: { status: { in: ["Delivered", "Completed"] } },
    select: { id: true, orderId: true, storeId: true, subtotal: true, total: true, deliveryFee: true, earning: true, driverId: true },
  })
  const done = new Set(
    (await prisma.transaction.findMany({ where: { receiptNo: { startsWith: "VTE-" } }, select: { receiptNo: true } })).map((t) => t.receiptNo),
  )
  const todo = delivered.filter((o) => !done.has(`VTE-${o.orderId}`))
  const share = (o: (typeof todo)[number]) => Math.max(0, (Number(o.subtotal) || Number(o.total) - Number(o.deliveryFee)) - (Number(o.earning) || 0))
  const byStore = new Map<string, number>()
  for (const o of todo) byStore.set(o.storeId, (byStore.get(o.storeId) ?? 0) + share(o))

  console.log(`Commandes livrees : ${delivered.length} · deja reglees pour la boutique : ${delivered.length - todo.length} · a rattraper : ${todo.length}`)
  for (const [storeId, amount] of byStore) {
    const s = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true, walletMoney: true } })
    console.log(`  ${s?.name ?? storeId} : +${Math.round(amount).toLocaleString("fr-FR")} F (solde actuel ${Math.round(s?.walletMoney ?? 0).toLocaleString("fr-FR")} F)`)
  }
  if (!apply) { console.log("\nSIMULATION : rien n'a ete modifie. Ajouter --apply pour appliquer."); return }

  for (const o of todo) await settleDeliveredOrder(o.id)
  console.log(`\nOK : ${todo.length} commande(s) reglee(s).`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
