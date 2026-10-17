import { NextResponse } from "next/server"
import { safeEqual } from "@/lib/auth"
import { audit } from "@/lib/security/audit"
import { runBackup } from "@/lib/security/backup"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Sauvegarde automatique quotidienne (Vercel Cron, voir vercel.json), protégée par CRON_SECRET.
 * Sans stockage configuré (BLOB_READ_WRITE_TOKEN), la sauvegarde est vérifiée mais non conservée : seul le
 * téléchargement manuel garde alors une copie.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  if (!secret || !safeEqual(bearer, secret)) return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  const r = await runBackup("auto", "cron", true)
  await audit(req, { email: "cron" }, "backup.create", r.record?.id ?? null, r.ok ? { taille: r.record?.size, lignes: r.record?.rows, stockée: !!r.record?.location } : { erreur: r.error }, r.ok ? "ok" : "échec")
  return NextResponse.json(r.ok ? { ok: true, size: r.record?.size, rows: r.record?.rows, stored: !!r.record?.location } : { ok: false, error: r.error }, { status: r.ok ? 200 : 500 })
}
