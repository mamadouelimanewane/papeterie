import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { isResponse, errorResponse } from "@/lib/adminAuth"

const CASHOUT = "Retrait" // même type que la page admin « Retraits boutiques » (/cashout/stores)
const METHODS = ["Wave", "Orange Money", "Virement"]

/** Solde + mouvements de la boutique connectée. */
export async function GET(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const [store, transactions] = await Promise.all([
      prisma.store.findUnique({ where: { id: auth.storeId }, select: { walletMoney: true } }),
      prisma.transaction.findMany({
        where: { storeId: auth.storeId }, orderBy: { createdAt: "desc" }, take: 100,
        select: { id: true, amount: true, type: true, method: true, description: true, receiptNo: true, status: true, createdAt: true },
      }),
    ])
    const pendingCashout = transactions
      .filter((t) => t.type === CASHOUT && t.status === "Pending")
      .reduce((s, t) => s + t.amount, 0)
    return NextResponse.json({ walletMoney: store?.walletMoney ?? 0, pendingCashout, methods: METHODS, transactions })
  } catch (e) { return errorResponse(e) }
}

/** Demande de retrait : { amount, method, account } — validée ensuite par l'admin. */
export async function POST(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const b = await req.json()
    const amount = Math.round(Number(b.amount))
    const method = METHODS.includes(b.method) ? String(b.method) : null
    const account = String(b.account ?? "").trim().slice(0, 100)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    if (!method) return NextResponse.json({ error: "Moyen de paiement invalide" }, { status: 400 })
    if (!account) return NextResponse.json({ error: "Numéro ou compte de réception requis" }, { status: 400 })

    const [store, pending] = await Promise.all([
      prisma.store.findUnique({ where: { id: auth.storeId }, select: { walletMoney: true } }),
      prisma.transaction.aggregate({ where: { storeId: auth.storeId, type: CASHOUT, status: "Pending" }, _sum: { amount: true } }),
    ])
    const available = (store?.walletMoney ?? 0) - (pending._sum.amount ?? 0)
    if (amount > available) {
      return NextResponse.json(
        { error: `Montant supérieur au solde disponible (${Math.max(available, 0).toLocaleString("fr-FR")} FCFA)` },
        { status: 400 }
      )
    }
    const tx = await prisma.transaction.create({
      data: { storeId: auth.storeId, type: CASHOUT, amount, method, description: account, status: "Pending" },
    })
    return NextResponse.json(tx, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
