import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CRUD_MODELS, coerce } from "@/lib/crudModels"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

type Params = { params: Promise<{ model: string; id: string }> }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (name: string) => (prisma as any)[name]

export async function PATCH(req: NextRequest, { params }: Params) {
  const { model, id } = await params
  const def = CRUD_MODELS[model]
  if (!def || def.readOnly) return NextResponse.json({ error: "Module inconnu" }, { status: 404 })
  const auth = await requireAdmin(req, def.manage)
  if (isResponse(auth)) return auth
  try {
    const row = await delegate(def.delegate).update({ where: { id }, data: coerce(def, await req.json(), true), include: def.include })
    return NextResponse.json(row)
  } catch (e) {
    if (e instanceof Error && /^Champ /.test(e.message)) return NextResponse.json({ error: e.message }, { status: 400 })
    return errorResponse(e)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { model, id } = await params
  const def = CRUD_MODELS[model]
  if (!def || def.readOnly) return NextResponse.json({ error: "Module inconnu" }, { status: 404 })
  const auth = await requireAdmin(req, def.manage)
  if (isResponse(auth)) return auth
  try {
    await delegate(def.delegate).delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
