import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { adminIdForToken, consumeResetTokens } from "@/lib/adminReset"
import { passwordProblem } from "@/lib/security/password"
import { audit } from "@/lib/security/audit"

export const runtime = "nodejs"

/** POST /api/admin-reset/confirm { token, password } — public, le jeton (1 h, usage unique) fait foi. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`admin-reset-confirm:${clientIp(req)}`, 10, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans 15 minutes" }, { status: 429 })
  }
  const { token, password } = await req.json().catch(() => ({}))
  if (typeof password !== "string") return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 })
  const adminId = typeof token === "string" ? await adminIdForToken(token) : null
  if (!adminId) return NextResponse.json({ error: "Lien invalide ou expiré : refaites une demande" }, { status: 400 })
  const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { email: true } })
  const pb = passwordProblem(password, admin?.email)
  if (pb) return NextResponse.json({ error: pb }, { status: 400 })

  // Nouveau mot de passe : toutes les sessions ouvertes (peut-être par un tiers) sont fermées
  await prisma.admin.update({ where: { id: adminId }, data: { password: await bcrypt.hash(password, 12), sessionsRevokedAt: new Date() } })
  await consumeResetTokens(adminId)
  await audit(req, { id: adminId, email: admin?.email }, "password.reset", admin?.email ?? adminId)
  return NextResponse.json({ ok: true })
}
