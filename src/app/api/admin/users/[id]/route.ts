import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireSuperAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { SUPER_ROLES } from "@/lib/permissions"
import { audit } from "@/lib/security/audit"
import { invalidateAdminCache, validRole } from "@/lib/security/adminSession"
import { passwordProblem } from "@/lib/security/password"

type Params = { params: Promise<{ id: string }> }
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** Reste-t-il au moins un super-administrateur actif en dehors de ce compte ? */
async function otherActiveSuperAdmins(id: string) {
  return prisma.admin.count({ where: { id: { not: id }, status: "Active", role: { in: SUPER_ROLES } } })
}

/**
 * Modification d'un compte — super-administrateur uniquement :
 * { name?, email?, phone?, role?, status?, password? } ou une action { revokeSessions: true } / { reset2fa: true }.
 * Mot de passe, statut ou rôle changés : les sessions ouvertes du compte sont fermées.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const self = id === auth.sub
    const a = await prisma.admin.findUnique({ where: { id } })
    if (!a) return bad("Compte introuvable", 404)
    const data = await req.json().catch(() => ({}))

    if (data.revokeSessions) {
      await prisma.admin.update({ where: { id }, data: { sessionsRevokedAt: new Date() } })
      invalidateAdminCache(id)
      await audit(req, auth, "admin.revoke", a.email)
      return NextResponse.json({ ok: true })
    }
    if (data.reset2fa) {
      await prisma.admin.update({ where: { id }, data: { twoFactorEnabled: false, twoFactorSecret: null, sessionsRevokedAt: new Date() } })
      invalidateAdminCache(id)
      await audit(req, auth, "2fa.reset", a.email)
      return NextResponse.json({ ok: true })
    }

    const update: Record<string, unknown> = {}
    const changes: Record<string, unknown> = {}
    let revoke = false
    if (typeof data.name === "string" && data.name.trim()) { update.name = data.name.trim().slice(0, 100); changes.nom = update.name }
    if (typeof data.phone === "string") { update.phone = data.phone.trim().slice(0, 30) || null; changes.téléphone = update.phone }
    if (typeof data.email === "string" && data.email.trim().toLowerCase() !== a.email) {
      const e = data.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return bad("Adresse e-mail invalide")
      if (await prisma.admin.findUnique({ where: { email: e } })) return bad("Cet e-mail existe déjà", 409)
      update.email = e; changes.email = e; revoke = true
    }
    if (data.role && data.role !== a.role) {
      if (self) return bad("Vous ne pouvez pas changer votre propre rôle")
      if (!(await validRole(data.role))) return bad("Rôle inconnu")
      if (SUPER_ROLES.includes(a.role) && !SUPER_ROLES.includes(data.role) && (await otherActiveSuperAdmins(id)) === 0) return bad("Il doit rester au moins un super-administrateur actif")
      update.role = data.role; changes.rôle = `${a.role} → ${data.role}`; revoke = true
    }
    if (data.status && data.status !== a.status) {
      if (!["Active", "Inactive"].includes(data.status)) return bad("Statut invalide")
      if (self) return bad("Vous ne pouvez pas désactiver votre propre compte")
      if (data.status === "Inactive" && SUPER_ROLES.includes(a.role) && (await otherActiveSuperAdmins(id)) === 0) return bad("Il doit rester au moins un super-administrateur actif")
      update.status = data.status; changes.statut = data.status; revoke = true
    }
    if (data.password) {
      const pb = passwordProblem(data.password, String(update.email ?? a.email))
      if (pb) return bad(pb)
      update.password = await bcrypt.hash(String(data.password), 12); changes.motDePasse = "réinitialisé"; revoke = !self
    }
    if (!Object.keys(update).length) return bad("Aucune modification")
    if (revoke) update.sessionsRevokedAt = new Date()
    const admin = await prisma.admin.update({ where: { id }, data: update, select: { id: true, name: true, email: true, role: true, status: true } })
    invalidateAdminCache(id)
    await audit(req, auth, "admin.update", a.email, changes)
    return NextResponse.json({ ok: true, admin })
  } catch (error) { return errorResponse(error, "Erreur serveur", "[admin/users PATCH]") }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    if (id === auth.sub) return bad("Vous ne pouvez pas supprimer votre propre compte")
    const a = await prisma.admin.findUnique({ where: { id } })
    if (!a) return bad("Compte introuvable", 404)
    if (SUPER_ROLES.includes(a.role) && a.status === "Active" && (await otherActiveSuperAdmins(id)) === 0) return bad("Impossible de supprimer le dernier super-administrateur actif")
    await prisma.admin.delete({ where: { id } })
    invalidateAdminCache(id)
    await audit(req, auth, "admin.delete", a.email, { rôle: a.role })
    return NextResponse.json({ ok: true })
  } catch (error) { return errorResponse(error, "Erreur serveur", "[admin/users DELETE]") }
}
