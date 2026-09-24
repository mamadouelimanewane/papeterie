import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { RECORD_COLLECTIONS, flatRecord, stripMeta } from "@/lib/recordCollections"

type Params = { params: Promise<{ collection: string; id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { collection, id } = await params
  const perms = RECORD_COLLECTIONS[collection]
  if (!perms) return NextResponse.json({ error: "Collection inconnue" }, { status: 404 })
  const auth = await requireAdmin(req, perms.manage)
  if (isResponse(auth)) return auth
  try {
    const current = await prisma.adminRecord.findFirst({ where: { id, collection } })
    if (!current) return NextResponse.json({ error: "Élément introuvable" }, { status: 404 })
    const patch = stripMeta(await req.json())
    const row = await prisma.adminRecord.update({
      where: { id },
      data: { data: { ...(current.data as object), ...patch } as object },
    })
    return NextResponse.json(flatRecord(row))
  } catch (e) { return errorResponse(e) }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { collection, id } = await params
  const perms = RECORD_COLLECTIONS[collection]
  if (!perms) return NextResponse.json({ error: "Collection inconnue" }, { status: 404 })
  const auth = await requireAdmin(req, perms.manage)
  if (isResponse(auth)) return auth
  try {
    const r = await prisma.adminRecord.deleteMany({ where: { id, collection } })
    if (r.count === 0) return NextResponse.json({ error: "Élément introuvable" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
