import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin, isResponse } from "@/lib/adminAuth"

// Rôles et permissions — super-administrateur uniquement (un rôle « * » donne tous les droits)
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const roles = await prisma.role.findMany({ orderBy: { createdAt: "asc" } })
    return NextResponse.json(roles)
  } catch (e) { console.error("[roles GET]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { name, description, permissions } = await req.json()
    if (!name) return NextResponse.json({ error: "Nom du rôle requis" }, { status: 400 })
    const exists = await prisma.role.findUnique({ where: { name } })
    if (exists) return NextResponse.json({ error: "Ce rôle existe deja" }, { status: 409 })
    const role = await prisma.role.create({ data: { name: String(name).trim(), description: description ?? null, permissions: Array.isArray(permissions) ? permissions : [] } })
    return NextResponse.json({ ok: true, role }, { status: 201 })
  } catch (e) { console.error("[roles POST]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}
