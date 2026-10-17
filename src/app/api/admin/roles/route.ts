import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { ALL_PERMISSIONS, SUPER_ROLES } from "@/lib/permissions"
import { audit } from "@/lib/security/audit"

/** Permissions connues uniquement (un nom inventé ne doit pas passer silencieusement). */
function cleanPermissions(p: unknown): string[] | null {
  if (!Array.isArray(p)) return []
  const list = [...new Set(p.map(String))]
  return list.every((x) => x === "*" || (ALL_PERMISSIONS as readonly string[]).includes(x)) ? list : null
}

/** Rôles avec le nombre de comptes qui les portent — super-administrateur uniquement. */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const [roles, counts] = await Promise.all([
      prisma.role.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.admin.groupBy({ by: ["role"], _count: { _all: true } }),
    ])
    return NextResponse.json(roles.map((r) => ({ ...r, admins: counts.find((c) => c.role === r.name)?._count._all ?? 0 })))
  } catch (e) { return errorResponse(e, "Erreur serveur", "[roles GET]") }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const { name, description, permissions } = await req.json()
    const n = String(name ?? "").trim().slice(0, 60)
    if (!n) return NextResponse.json({ error: "Nom du rôle requis" }, { status: 400 })
    if (SUPER_ROLES.includes(n)) return NextResponse.json({ error: "Nom réservé au super-administrateur" }, { status: 400 })
    const perms = cleanPermissions(permissions)
    if (!perms) return NextResponse.json({ error: "Permission inconnue dans la liste" }, { status: 400 })
    if (await prisma.role.findUnique({ where: { name: n } })) return NextResponse.json({ error: "Ce rôle existe déjà" }, { status: 409 })
    const role = await prisma.role.create({ data: { name: n, description: description ? String(description).slice(0, 300) : null, permissions: perms } })
    await audit(req, auth, "role.create", n, { permissions: perms })
    return NextResponse.json({ ok: true, role }, { status: 201 })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[roles POST]") }
}
