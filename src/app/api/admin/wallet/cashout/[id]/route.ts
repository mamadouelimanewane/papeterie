import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

class CashoutError extends Error { constructor(message: string, public status: number) { super(message) } }

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

    // Approbation ATOMIQUE : la demande est « prise » (Pending -> Completed) et le solde debite uniquement s'il couvre
    // encore le montant, dans une seule transaction. Deux approbations simultanees ne peuvent donc pas depasser le solde.
    const receipt = `RET-${Date.now().toString(36).toUpperCase()}`
    let r
    try {
      r = await prisma.$transaction(async (db) => {
        const claim = await db.transaction.updateMany({ where: { id, status: "Pending" }, data: { status: "Completed", receiptNo: receipt } })
        if (claim.count !== 1) throw new CashoutError("Demande déjà traitée", 409)
        const debit = t.driverId
          ? await db.driver.updateMany({ where: { id: t.driverId, walletMoney: { gte: t.amount } }, data: { walletMoney: { decrement: t.amount } } })
          : t.storeId
            ? await db.store.updateMany({ where: { id: t.storeId, walletMoney: { gte: t.amount } }, data: { walletMoney: { decrement: t.amount } } })
            : { count: 0 }
        if (debit.count !== 1) throw new CashoutError("Solde insuffisant ou compte introuvable", 400)
        return db.transaction.findUnique({ where: { id } })
      })
    } catch (e) {
      if (e instanceof CashoutError) return NextResponse.json({ error: e.message }, { status: e.status })
      throw e
    }
    return NextResponse.json(r)
  } catch (e) { return errorResponse(e) }
}
