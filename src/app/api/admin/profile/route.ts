import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Profil de l'administrateur connecté (table Admin, id = token.sub).
 * Le compte « super admin » défini par variables d'environnement (id admin-env) n'est pas modifiable ici.
 */
const ENV_ID = "admin-env"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: NextRequest) {
  const token = await requireAdmin(req)
  if (isResponse(token)) return token
  if (token.sub === ENV_ID) {
    return NextResponse.json({ id: ENV_ID, name: token.name ?? "Admin", email: token.email, phone: null, role: "admin", editable: false })
  }
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: token.sub },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true },
    })
    if (!admin) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    return NextResponse.json({ ...admin, editable: true })
  } catch (e) { return errorResponse(e) }
}

/**
 * Corps : { name, email, phone } pour les informations,
 * ou { currentPassword, newPassword } pour le mot de passe.
 */
export async function PUT(req: NextRequest) {
  const token = await requireAdmin(req)
  if (isResponse(token)) return token
  if (token.sub === ENV_ID) {
    return NextResponse.json({ error: "Ce compte est défini par la configuration serveur et ne peut pas être modifié ici" }, { status: 403 })
  }
  try {
    const body = await req.json()
    const admin = await prisma.admin.findUnique({ where: { id: token.sub } })
    if (!admin) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })

    if ("newPassword" in body) {
      const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string }
      if (!currentPassword || !(await bcrypt.compare(currentPassword, admin.password))) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
      }
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 })
      }
      await prisma.admin.update({ where: { id: admin.id }, data: { password: await bcrypt.hash(newPassword, 10) } })
      return NextResponse.json({ ok: true })
    }

    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const phone = String(body.phone ?? "").trim()
    if (name.length < 2) return NextResponse.json({ error: "Nom requis" }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "E-mail invalide" }, { status: 400 })
    if (phone && !/^[+\d][\d\s.-]{6,19}$/.test(phone)) return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 })

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: { name, email, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
    return NextResponse.json({ ...updated, editable: true, emailChanged: email !== admin.email })
  } catch (e) { return errorResponse(e) }
}
