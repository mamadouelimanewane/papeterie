import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, isResponse } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? "25"))
    const userId = searchParams.get("userId") ?? ""
    const driverId = searchParams.get("driverId") ?? ""
    const storeId = searchParams.get("storeId") ?? ""
    const type = searchParams.get("type") ?? ""

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (driverId) where.driverId = driverId
    if (storeId) where.storeId = storeId
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ transactions, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Ecriture manuelle d'une transaction + mise a jour du solde. Reservee a la permission « wallet.manage »
 * (la page /api/admin/wallet est la voie normale ; celle-ci est conservee pour compatibilite).
 * Credit = type « Credit » / « Crédit » ; tout autre type est un debit ; une boutique est aussi creditable/debitable.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "wallet.manage")
  if (isResponse(auth)) return auth
  try {
    const data = await req.json()
    const amount = Number(data.amount)
    if (!Number.isFinite(amount) || amount <= 0 || !data.type) {
      return NextResponse.json({ error: "amount (> 0) et type sont requis" }, { status: 400 })
    }
    const parties = [data.userId, data.driverId, data.storeId].filter(Boolean)
    if (parties.length !== 1) return NextResponse.json({ error: "Un seul compte (userId, driverId ou storeId) attendu" }, { status: 400 })
    const isCredit = /^cr[eé]dit/i.test(String(data.type))
    const delta = isCredit ? amount : -amount

    const tx = await prisma.$transaction(async (db) => {
      // Un debit ne peut pas rendre le solde negatif (mise a jour conditionnelle)
      const guard = isCredit ? {} : { walletMoney: { gte: amount } }
      const updated = data.userId
        ? await db.user.updateMany({ where: { id: data.userId, ...guard }, data: { walletMoney: { increment: delta } } })
        : data.driverId
          ? await db.driver.updateMany({ where: { id: data.driverId, ...guard }, data: { walletMoney: { increment: delta } } })
          : await db.store.updateMany({ where: { id: data.storeId, ...guard }, data: { walletMoney: { increment: delta } } })
      if (updated.count !== 1) throw new Error("Compte introuvable ou solde insuffisant")
      return db.transaction.create({
        data: {
          userId: data.userId ?? null, driverId: data.driverId ?? null, storeId: data.storeId ?? null,
          amount, type: isCredit ? "Crédit" : "Débit", method: String(data.method ?? "Manuel"),
          description: data.description ? String(data.description) : null,
          receiptNo: data.receiptNo ? String(data.receiptNo) : `ADM-${Date.now().toString(36).toUpperCase()}`,
          status: "Completed",
        },
      })
    })
    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: msg.startsWith("Compte") ? 400 : 500 })
  }
}
