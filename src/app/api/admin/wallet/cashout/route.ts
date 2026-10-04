import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/** Demandes de retrait (Transaction type « Retrait ») des livreurs ou des boutiques. */
const TYPE = "Retrait"

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "reports.view")
  if (isResponse(auth)) return auth
  try {
    const party = req.nextUrl.searchParams.get("party") === "store" ? "store" : "driver"
    const tx = await prisma.transaction.findMany({
      where: { type: TYPE, ...(party === "driver" ? { driverId: { not: null } } : { storeId: { not: null } }) },
      orderBy: { createdAt: "desc" },
      include: { driver: { select: { name: true, phone: true, walletMoney: true } } },
    })
    const storeIds = [...new Set(tx.map((t) => t.storeId).filter(Boolean))] as string[]
    const stores = await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, phone: true, walletMoney: true } })
    const byId = new Map(stores.map((s) => [s.id, s]))
    return NextResponse.json(tx.map((t) => {
      const who = t.driver ?? (t.storeId ? byId.get(t.storeId) : null)
      return { id: t.id, name: who?.name ?? "—", phone: who?.phone ?? "", balance: who?.walletMoney ?? 0, amount: t.amount, method: t.method, account: t.description ?? "", status: t.status, date: t.createdAt }
    }))
  } catch (e) { return errorResponse(e) }
}

/** Enregistre une nouvelle demande de retrait. Corps : { party, id, amount, method, account } */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "wallet.manage")
  if (isResponse(auth)) return auth
  try {
    const b = await req.json()
    const amount = Number(b.amount)
    if (!["driver", "store"].includes(b.party) || !b.id) return NextResponse.json({ error: "Compte invalide" }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    const tx = await prisma.transaction.create({
      data: {
        type: TYPE, amount, method: String(b.method || "Wave"), description: String(b.account || ""), status: "Pending",
        ...(b.party === "driver" ? { driverId: b.id } : { storeId: b.id }),
      },
    })
    return NextResponse.json(tx, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
