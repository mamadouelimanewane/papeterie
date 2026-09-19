import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const roles = await prisma.role.findMany({ orderBy: { createdAt: "asc" } })
    return NextResponse.json(roles)
  } catch (e) { console.error("[roles GET]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const { name, description, permissions } = await req.json()
    if (!name) return NextResponse.json({ error: "Nom du rôle requis" }, { status: 400 })
    const exists = await prisma.role.findUnique({ where: { name } })
    if (exists) return NextResponse.json({ error: "Ce rôle existe deja" }, { status: 409 })
    const role = await prisma.role.create({ data: { name: String(name).trim(), description: description ?? null, permissions: Array.isArray(permissions) ? permissions : [] } })
    return NextResponse.json({ ok: true, role }, { status: 201 })
  } catch (e) { console.error("[roles POST]", e); return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }) }
}
