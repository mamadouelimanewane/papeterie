import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { audit } from "@/lib/security/audit"
import { invalidateAdminCache } from "@/lib/security/adminSession"
import { decryptText, encryptText, newTotpSecret, otpauthUrl, verifyTotp } from "@/lib/security/crypto"
import { rateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"

/** Mon compte uniquement (toute session admin). Le compte de secours (variables d'environnement) n'a pas de fiche. */
async function me(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (isResponse(auth)) return { res: auth }
  const admin = await prisma.admin.findUnique({ where: { id: String(auth.sub) } })
  if (!admin) return { res: NextResponse.json({ error: "Compte de secours : double authentification indisponible" }, { status: 400 }) }
  return { auth, admin }
}

/** État ; si inactive, prépare un nouveau secret (QR code à scanner) sans encore l'activer. */
export async function GET(req: NextRequest) {
  const r = await me(req)
  if (r.res) return r.res
  try {
    if (r.admin.twoFactorEnabled) return NextResponse.json({ enabled: true })
    const secret = newTotpSecret()
    await prisma.admin.update({ where: { id: r.admin.id }, data: { twoFactorSecret: encryptText(secret) } })
    const url = otpauthUrl(secret, r.admin.email)
    return NextResponse.json({ enabled: false, secret, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[2fa GET]") }
}

/** { code } : active la double authentification après vérification d'un premier code. */
export async function POST(req: NextRequest) {
  const r = await me(req)
  if (r.res) return r.res
  try {
    if (!(await rateLimit("2fa-setup:" + r.admin.id, 10, 15 * 60_000))) return NextResponse.json({ error: "Trop d'essais, réessayez dans 15 minutes" }, { status: 429 })
    const { code } = await req.json().catch(() => ({}))
    if (r.admin.twoFactorEnabled) return NextResponse.json({ error: "Déjà activée" }, { status: 409 })
    if (!r.admin.twoFactorSecret || !verifyTotp(decryptText(r.admin.twoFactorSecret), code)) return NextResponse.json({ error: "Code incorrect : vérifiez l'heure du téléphone et réessayez" }, { status: 400 })
    await prisma.admin.update({ where: { id: r.admin.id }, data: { twoFactorEnabled: true } })
    invalidateAdminCache(r.admin.id)
    await audit(req, r.auth, "2fa.enable", r.admin.email)
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[2fa POST]") }
}

/** { code } : désactivation (code actuel exigé). Refusée si la politique de sécurité l'impose. */
export async function DELETE(req: NextRequest) {
  const r = await me(req)
  if (r.res) return r.res
  try {
    const s = await prisma.appSetting.findUnique({ where: { key: "security" } })
    if ((s?.value as { require2fa?: boolean } | null)?.require2fa) return NextResponse.json({ error: "La double authentification est obligatoire pour tous les administrateurs" }, { status: 403 })
    const { code } = await req.json().catch(() => ({}))
    if (!r.admin.twoFactorEnabled || !r.admin.twoFactorSecret) return NextResponse.json({ error: "Non activée" }, { status: 409 })
    if (!verifyTotp(decryptText(r.admin.twoFactorSecret), code)) return NextResponse.json({ error: "Code incorrect" }, { status: 400 })
    await prisma.admin.update({ where: { id: r.admin.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    invalidateAdminCache(r.admin.id)
    await audit(req, r.auth, "2fa.disable", r.admin.email)
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[2fa DELETE]") }
}
