import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { newInviteToken } from "@/lib/merchantAuth"

/** État de l'accès marchand d'une boutique (sans jamais renvoyer de secret). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "stores.view")
  if (isResponse(auth)) return auth
  const { id } = await params
  const store = await prisma.store.findUnique({
    where: { id },
    select: { password: true, inviteExpiresAt: true, lastLoginAt: true },
  })
  if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
  return NextResponse.json({
    hasPassword: !!store.password,
    invitePending: !!store.inviteExpiresAt && store.inviteExpiresAt > new Date(),
    inviteExpiresAt: store.inviteExpiresAt,
    lastLoginAt: store.lastLoginAt,
  })
}

/**
 * Génère un lien d'invitation (aléatoire, usage unique, 72 h) qui permet au marchand de
 * définir — ou redéfinir — son mot de passe. Un nouveau lien remplace le précédent.
 * Le jeton en clair n'est renvoyé qu'ici, une seule fois : seul son hash est stocké.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const { token, hash, expiresAt } = newInviteToken()
    await prisma.store.update({ where: { id }, data: { inviteTokenHash: hash, inviteExpiresAt: expiresAt } })
    const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    return NextResponse.json({ url: `${base}/merchant/login?invite=${token}`, expiresAt })
  } catch (e) { return errorResponse(e) }
}

/** Révoque l'accès : mot de passe et lien effacés, sessions marchand en cours coupées. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    await prisma.store.update({
      where: { id },
      data: { password: null, inviteTokenHash: null, inviteExpiresAt: null, sessionsRevokedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
