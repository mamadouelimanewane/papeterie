import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Modifier un compte (role, statut, ou reinitialiser le mot de passe)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const update: Record<string, unknown> = {}
    if (data.name) update.name = String(data.name).trim()
    if (data.role) update.role = data.role
    if (data.status) update.status = data.status
    if (data.password) update.password = await bcrypt.hash(String(data.password), 10)

    const admin = await prisma.admin.update({
      where: { id },
      data: update,
      select: { id: true, name: true, email: true, role: true, status: true },
    })
    return NextResponse.json({ ok: true, admin })
  } catch (error) {
    console.error("[admin/users PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const count = await prisma.admin.count()
    if (count <= 1) return NextResponse.json({ error: "Impossible de supprimer le dernier admin" }, { status: 400 })
    await prisma.admin.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/users DELETE]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
