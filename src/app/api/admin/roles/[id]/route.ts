import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { ALL_PERMISSIONS, SUPER_ROLES } from "@/lib/permissions"
import { audit } from "@/lib/security/audit"
import { invalidateAdminCache } from "@/lib/security/adminSession"

type Params = { params: Promise<{ id: string }> }

/**
 * { name?, description?, permissions?, status? } — effet immédiat sur les comptes qui portent ce rôle
 * (droits relus en direct). Renommer un rôle met à jour ces comptes.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const r = await prisma.role.findUnique({ where: { id } })
    if (!r) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })
    const data = await req.json()
    const update: Record<string, unknown> = {}
    const changes: Record<string, unknown> = {}
    if (typeof data.name === "string" && data.name.trim() && data.name.trim() !== r.name) {
      const n = data.name.trim().slice(0, 60)
      if (SUPER_ROLES.includes(n)) return NextResponse.json({ error: "Nom réservé au super-administrateur" }, { status: 400 })
      if (await prisma.role.findUnique({ where: { name: n } })) return NextResponse.json({ error: "Ce rôle existe déjà" }, { status: 409 })
      update.name = n; changes.nom = `${r.name} → ${n}`
    }
    if (data.description !== undefined) update.description = data.description ? String(data.description).slice(0, 300) : null
    if (data.permissions !== undefined) {
      const list = Array.isArray(data.permissions) ? [...new Set((data.permissions as unknown[]).map(String))] : null
      if (!list || !list.every((x) => x === "*" || (ALL_PERMISSIONS as readonly string[]).includes(x))) return NextResponse.json({ error: "Permission inconnue dans la liste" }, { status: 400 })
      update.permissions = list
      const before = Array.isArray(r.permissions) ? (r.permissions as string[]) : []
      changes.ajoutées = list.filter((x) => !before.includes(x)); changes.retirées = before.filter((x) => !list.includes(x))
    }
    if (data.status) {
      if (!["Active", "Inactive"].includes(data.status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
      update.status = data.status; changes.statut = data.status
    }
    const role = await prisma.$transaction(async (tx) => {
      const out = await tx.role.update({ where: { id }, data: update })
      if (update.name) await tx.admin.updateMany({ where: { role: r.name }, data: { role: String(update.name) } })
      return out
    })
    invalidateAdminCache()
    await audit(req, auth, "role.update", r.name, changes)
    return NextResponse.json({ ok: true, role })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[roles PATCH]") }
}

/** Suppression refusée tant que des comptes portent ce rôle (ils perdraient tous leurs droits). */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const r = await prisma.role.findUnique({ where: { id } })
    if (!r) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })
    const used = await prisma.admin.count({ where: { role: r.name } })
    if (used) return NextResponse.json({ error: `${used} compte(s) utilisent ce rôle : attribuez-leur un autre rôle d'abord` }, { status: 409 })
    await prisma.role.delete({ where: { id } })
    invalidateAdminCache()
    await audit(req, auth, "role.delete", r.name)
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[roles DELETE]") }
}
