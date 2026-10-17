import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireSuperAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { validRole } from "@/lib/security/adminSession"
import { audit } from "@/lib/security/audit"
import { passwordProblem } from "@/lib/security/password"

/** Comptes d'administration — super-administrateur uniquement (avec dernière connexion et double authentification). */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true, lastLoginAt: true, twoFactorEnabled: true, sessionsRevokedAt: true },
    })
    return NextResponse.json(admins.map((a) => ({ ...a, me: a.id === auth.sub })))
  } catch (error) { return errorResponse(error, "Erreur serveur", "[admin/users GET]") }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { name, email, password, role, status, phone } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: "Nom, e-mail et mot de passe requis" }, { status: 400 })
    const cleanEmail = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail)) return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 })
    const pb = passwordProblem(password, cleanEmail)
    if (pb) return NextResponse.json({ error: pb }, { status: 400 })
    const r = role || "SubAdmin"
    if (r !== "SubAdmin" && !(await validRole(r))) return NextResponse.json({ error: "Rôle inconnu : créez-le d'abord" }, { status: 400 })
    if (await prisma.admin.findUnique({ where: { email: cleanEmail } })) return NextResponse.json({ error: "Cet e-mail existe déjà" }, { status: 409 })
    const admin = await prisma.admin.create({
      data: {
        name: String(name).trim().slice(0, 100), email: cleanEmail, phone: phone ? String(phone).slice(0, 30) : null,
        password: await bcrypt.hash(String(password), 12), role: r, status: status === "Inactive" ? "Inactive" : "Active",
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    })
    await audit(req, auth, "admin.create", admin.email, { rôle: admin.role, statut: admin.status })
    return NextResponse.json({ ok: true, admin }, { status: 201 })
  } catch (error) { return errorResponse(error, "Erreur serveur", "[admin/users POST]") }
}
