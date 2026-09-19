import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { console.error("[roles DELETE]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}
