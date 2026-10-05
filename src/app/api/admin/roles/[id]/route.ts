import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin, isResponse } from "@/lib/adminAuth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const data = await req.json()
    const update: Record<string, unknown> = {}
    if (data.name) update.name = String(data.name).trim()
    if (data.description !== undefined) update.description = data.description
    if (Array.isArray(data.permissions)) update.permissions = data.permissions
    if (data.status) update.status = data.status
    const role = await prisma.role.update({ where: { id }, data: update })
    return NextResponse.json({ ok: true, role })
  } catch (e) { console.error("[roles PATCH]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { console.error("[roles DELETE]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}
