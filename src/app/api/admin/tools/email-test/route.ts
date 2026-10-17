import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, isResponse } from "@/lib/adminAuth"
import { resetSettingsCache } from "@/lib/appSettings"
import { isRealEmail, sendMail } from "@/lib/mailer"

export const runtime = "nodejs"

/** Envoi d'un e-mail de test avec les réglages enregistrés : { to }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "settings.manage")
  if (isResponse(auth)) return auth
  const { to } = await req.json().catch(() => ({}))
  if (!isRealEmail(typeof to === "string" ? to : null)) return NextResponse.json({ ok: false, error: "Adresse e-mail invalide" }, { status: 400 })
  resetSettingsCache("email") // réglages tout juste enregistrés
  const r = await sendMail(to, "Test d'envoi — Schoolmatik", "Bonjour,\n\nCet e-mail de test confirme que l'envoi des e-mails du site fonctionne.\n\nSchoolmatik Librairie")
  return NextResponse.json(r, { status: r.ok ? 200 : 502 })
}
