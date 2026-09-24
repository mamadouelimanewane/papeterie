import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Traite une demande de retrait. Corps : { action: "approve" | "reject" }
 * Approuver = débite le portefeuille du livreur / de la boutique (solde vérifié) et passe la demande en « Completed ».
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "wallet.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const { action } = await req.json()
    const t = await prisma.transaction.findUnique({ where: { id } })
    if (!t || t.type !== "Retrait") return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    if (t.status !== "Pending") return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 })

    if (action === "reject") {
      const r = await prisma.transaction.update({ where: { id }, data: { status: "Rejected" } })
      return NextResponse.json(r)
    }
    if (action !== "approve") return NextResponse.json({ error: "Action invalide" }, { status: 400 })

    const account = t.driverId
      ? await prisma.driver.findUnique({ where: { id: t.driverId }, select: { walletMoney: true } })
      : t.storeId ? await prisma.store.findUnique({ where: { id: t.storeId }, select: { walletMoney: true } }) : null
    if (!account) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    if (account.walletMoney < t.amount) {
      return NextResponse.json({ error: `Solde insuffisant : ${account.walletMoney.toLocaleString("fr-FR")} FCFA disponibles` }, { status: 400 })
    }
    const [r] = await prisma.$transaction([
      prisma.transaction.update({ where: { id }, data: { status: "Completed", receiptNo: `RET-${Date.now().toString(36).toUpperCase()}` } }),
      t.driverId
        ? prisma.driver.update({ where: { id: t.driverId }, data: { walletMoney: { decrement: t.amount } } })
        : prisma.store.update({ where: { id: t.storeId! }, data: { walletMoney: { decrement: t.amount } } }),
    ])
    return NextResponse.json(r)
  } catch (e) { return errorResponse(e) }
}
