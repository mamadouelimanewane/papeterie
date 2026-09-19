import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Liste des comptes d'administration (sous-admins)
export async function GET() {
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

// Creer un compte d'administration
export async function POST(req: Request) {
  try {
    const { name, email, password, role, status } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 })
    }
    const exists = await prisma.admin.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: "Cet email existe deja" }, { status: 409 })

    const admin = await prisma.admin.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: await bcrypt.hash(String(password), 10),
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
