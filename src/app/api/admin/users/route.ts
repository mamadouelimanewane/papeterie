import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireSuperAdmin, isResponse } from "@/lib/adminAuth"

const MIN_PASSWORD = 10

// Liste des comptes d'administration (sous-admins) — super-administrateur uniquement
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    })
    return NextResponse.json(admins)
  } catch (error) {
    console.error("[admin/users GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Creer un compte d'administration — super-administrateur uniquement
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { name, email, password, role, status } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 })
    }
    if (String(password).length < MIN_PASSWORD) {
      return NextResponse.json({ error: `Mot de passe trop court (${MIN_PASSWORD} caractères minimum)` }, { status: 400 })
    }
    const cleanEmail = String(email).trim().toLowerCase()
    const exists = await prisma.admin.findUnique({ where: { email: cleanEmail } })
    if (exists) return NextResponse.json({ error: "Cet email existe deja" }, { status: 409 })

    const admin = await prisma.admin.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        password: await bcrypt.hash(String(password), 12),
        role: role || "SubAdmin",
        status: status || "Active",
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    })
    return NextResponse.json({ ok: true, admin }, { status: 201 })
  } catch (error) {
    console.error("[admin/users POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
