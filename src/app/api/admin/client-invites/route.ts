import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { appOrigin, CLIENT_INVITE_TTL_MS, INVITE_COLLECTION, localPhone, newClientInviteCode, type ClientInviteData } from "@/lib/clientInvites"

const MAX_PER_BATCH = 500

type InviteView = { userId: string; name: string; phone: string; link: string; createdAt: string; expiresAt: string; openedAt: string | null; installedAt: string | null }

/** GET : invitations existantes (lien, ouverture, installation), éventuellement filtrées par ?userIds=a,b */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "users.view")
  if (isResponse(auth)) return auth
  try {
    const only = req.nextUrl.searchParams.get("userIds")?.split(",").filter(Boolean)
    const recs = await prisma.adminRecord.findMany({ where: { collection: INVITE_COLLECTION }, orderBy: { createdAt: "asc" } })
    const origin = appOrigin(req.nextUrl.origin)
    const out: InviteView[] = []
    for (const r of recs) {
      const d = r.data as ClientInviteData
      if (only && !only.includes(d.userId)) continue
      out.push({ userId: d.userId, name: d.name, phone: d.phone, link: `${origin}/i/${d.code}`, createdAt: r.createdAt.toISOString(), expiresAt: d.expiresAt, openedAt: d.openedAt, installedAt: d.installedAt })
    }
    return NextResponse.json(out)
  } catch (e) { return errorResponse(e) }
}

/**
 * POST { userIds, renew? } : lien d'invitation de chaque client choisi.
 * Un lien encore valide est réutilisé ; `renew: true` en crée un nouveau (l'ancien cesse de fonctionner).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "users.manage")
  if (isResponse(auth)) return auth
  try {
    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.userIds) ? [...new Set<string>(body.userIds.filter((x: unknown): x is string => typeof x === "string"))] : []
    if (ids.length === 0) return NextResponse.json({ error: "Choisissez au moins un client" }, { status: 400 })
    if (ids.length > MAX_PER_BATCH) return NextResponse.json({ error: `${MAX_PER_BATCH} clients au maximum par envoi` }, { status: 400 })

    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, phone: true } })
    if (users.length === 0) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    const existing = await prisma.adminRecord.findMany({ where: { collection: INVITE_COLLECTION, OR: users.map((u) => ({ data: { path: ["userId"], equals: u.id } })) } })
    const origin = appOrigin(req.nextUrl.origin)
    const createdBy = String(auth.email ?? auth.name ?? "admin")

    const invites: InviteView[] = []
    for (const u of users) {
      const old = existing.find((r) => (r.data as ClientInviteData).userId === u.id)
      const oldData = old?.data as ClientInviteData | undefined
      if (old && oldData && !body.renew && new Date(oldData.expiresAt).getTime() > Date.now()) {
        invites.push({ userId: u.id, name: u.name, phone: oldData.phone, link: `${origin}/i/${oldData.code}`, createdAt: old.createdAt.toISOString(), expiresAt: oldData.expiresAt, openedAt: oldData.openedAt, installedAt: oldData.installedAt })
        continue
      }
      const data: ClientInviteData = {
        code: newClientInviteCode(), userId: u.id, name: u.name, phone: localPhone(u.phone), createdBy,
        expiresAt: new Date(Date.now() + CLIENT_INVITE_TTL_MS).toISOString(), openedAt: null, installedAt: null,
      }
      // Une seule invitation par client
      const rec = await prisma.$transaction(async (tx) => {
        if (old) await tx.adminRecord.delete({ where: { id: old.id } })
        return tx.adminRecord.create({ data: { collection: INVITE_COLLECTION, data } })
      })
      invites.push({ userId: u.id, name: u.name, phone: data.phone, link: `${origin}/i/${data.code}`, createdAt: rec.createdAt.toISOString(), expiresAt: data.expiresAt, openedAt: null, installedAt: null })
    }
    return NextResponse.json({ invites, missing: ids.filter((id) => !users.some((u) => u.id === id)) }, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
