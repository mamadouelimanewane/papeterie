import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireSuperAdmin, isResponse } from "@/lib/adminAuth"

const MIN_PASSWORD = 10

// Modifier un compte (role, statut, ou reinitialiser le mot de passe) — super-administrateur uniquement
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const data = await req.json()
    const update: Record<string, unknown> = {}
    if (data.name) update.name = String(data.name).trim()
    if (data.role) update.role = data.role
    if (data.status) update.status = data.status
    if (data.password) {
      if (String(data.password).length < MIN_PASSWORD) {
        return NextResponse.json({ error: `Mot de passe trop court (${MIN_PASSWORD} caractères minimum)` }, { status: 400 })
      }
      update.password = await bcrypt.hash(String(data.password), 12)
    }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
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
