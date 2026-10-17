import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { getActiveStoreId } from "@/lib/store"
import { parseKit } from "@/lib/kitAdmin"

/** GET : tous les kits de la boutique active (actifs et inactifs), pour le back-office. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "stores.view")
  if (isResponse(auth)) return auth
  try {
    const storeId = await getActiveStoreId()
    if (!storeId) return NextResponse.json([])
    return NextResponse.json(await prisma.kit.findMany({ where: { storeId }, orderBy: [{ sequence: "asc" }, { createdAt: "asc" }] }))
  } catch (e) { return errorResponse(e) }
}

/** POST : créer un kit (nom, classe, cycle, articles, remise). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const parsed = parseKit(await req.json().catch(() => ({})), false)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const storeId = await getActiveStoreId()
    if (!storeId) return NextResponse.json({ error: "Aucune boutique active" }, { status: 400 })
    const last = await prisma.kit.findFirst({ where: { storeId }, orderBy: { sequence: "desc" }, select: { sequence: true } })
    const kit = await prisma.kit.create({
      data: {
        storeId, name: parsed.name!, level: parsed.level!, cycle: parsed.cycle!, series: parsed.series ?? null,
        description: parsed.description ?? null, image: parsed.image ?? null, discountPct: parsed.discountPct ?? 0,
        items: parsed.items!, price: parsed.price!, sequence: parsed.sequence ?? (last?.sequence ?? 0) + 1, status: parsed.status ?? "Active",
      },
    })
    return NextResponse.json(kit, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
