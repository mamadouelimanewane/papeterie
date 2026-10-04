import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Ajustement manuel d'un portefeuille (client, livreur ou boutique) :
 * crée la transaction ET met à jour le solde dans une même transaction SQL.
 * Corps : { party: "user"|"driver"|"store", id, amount, direction: "Crédit"|"Débit", method, description }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "wallet.manage")
  if (isResponse(auth)) return auth
  try {
    const b = await req.json()
    const amount = Number(b.amount)
    if (!["user", "driver", "store"].includes(b.party) || !b.id) return NextResponse.json({ error: "Compte invalide" }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    const credit = b.direction !== "Débit"
    const delta = credit ? amount : -amount
    const delegate = b.party === "user" ? prisma.user : b.party === "driver" ? prisma.driver : prisma.store

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (delegate as any).findUnique({ where: { id: b.id }, select: { walletMoney: true, name: true } })
    if (!account) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    if (!credit && account.walletMoney < amount) return NextResponse.json({ error: `Solde insuffisant (${account.walletMoney.toLocaleString("fr-FR")} FCFA)` }, { status: 400 })

    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount, type: credit ? "Crédit" : "Débit", method: String(b.method || "Manuel"),
          description: String(b.description || (credit ? "Recharge manuelle" : "Débit manuel")),
          status: "Completed", receiptNo: `ADM-${Date.now().toString(36).toUpperCase()}`,
          ...(b.party === "user" ? { userId: b.id } : b.party === "driver" ? { driverId: b.id } : { storeId: b.id }),
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (delegate as any).update({ where: { id: b.id }, data: { walletMoney: { increment: delta } } }),
    ])
    return NextResponse.json({ ok: true, transaction: tx, balance: account.walletMoney + delta }, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
