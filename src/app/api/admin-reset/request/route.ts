import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { mailConfigured, sendEventMail } from "@/lib/mailer"
import { createResetToken } from "@/lib/adminReset"

export const runtime = "nodejs"

/**
 * POST /api/admin-reset/request { email } — public.
 * Envoie un lien de réinitialisation si le compte existe. La réponse est toujours la même,
 * pour ne pas révéler quelles adresses ont un compte administrateur.
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`admin-reset:${clientIp(req)}`, 5, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop de demandes, réessayez dans 15 minutes" }, { status: 429 })
  }
  const { email } = await req.json().catch(() => ({}))
  const mail = typeof email === "string" ? email.trim().toLowerCase() : ""
  const configured = await mailConfigured()
  if (mail && configured && (await rateLimit(`admin-reset:${mail}`, 3, 60 * 60_000))) {
    const admin = await prisma.admin.findFirst({ where: { email: { equals: mail, mode: "insensitive" }, status: "Active" }, select: { id: true, name: true, email: true } })
    if (admin) {
      const token = await createResetToken(admin.id)
      const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
      await sendEventMail("password_reset", admin.email, { name: admin.name, link: `${base}/login/reset?token=${token}` })
    }
  }
  // mailConfigured indique seulement si le site sait envoyer des e-mails (réglage global, rien sur le compte)
  return NextResponse.json({ ok: true, mailConfigured: configured })
}
