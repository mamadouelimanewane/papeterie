import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { getActiveStoreId } from "@/lib/store"
import { parseKit } from "@/lib/kitAdmin"

type Ctx = { params: Promise<{ id: string }> }

/** PATCH : modifier un kit de la boutique active. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const parsed = parseKit(await req.json().catch(() => ({})), true)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const storeId = await getActiveStoreId()
    const { count } = await prisma.kit.updateMany({ where: { id, storeId: storeId ?? undefined }, data: parsed })
    if (count !== 1) return NextResponse.json({ error: "Kit introuvable" }, { status: 404 })
    return NextResponse.json(await prisma.kit.findUnique({ where: { id } }))
  } catch (e) { return errorResponse(e) }
}

/** DELETE : supprimer un kit (les commandes passées gardent leur détail). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const storeId = await getActiveStoreId()
    const { count } = await prisma.kit.deleteMany({ where: { id, storeId: storeId ?? undefined } })
    if (count !== 1) return NextResponse.json({ error: "Kit introuvable" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
