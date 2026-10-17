import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { adminIdForToken, consumeResetTokens } from "@/lib/adminReset"

export const runtime = "nodejs"

/** POST /api/admin-reset/confirm { token, password } — public, le jeton (1 h, usage unique) fait foi. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`admin-reset-confirm:${clientIp(req)}`, 10, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans 15 minutes" }, { status: 429 })
  }
  const { token, password } = await req.json().catch(() => ({}))
  if (typeof password !== "string" || password.length < 10) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 10 caractères" }, { status: 400 })
  }
  const adminId = typeof token === "string" ? await adminIdForToken(token) : null
  if (!adminId) return NextResponse.json({ error: "Lien invalide ou expiré : refaites une demande" }, { status: 400 })

  await prisma.admin.update({ where: { id: adminId }, data: { password: await bcrypt.hash(password, 10) } })
  await consumeResetTokens(adminId)
  return NextResponse.json({ ok: true })
}
