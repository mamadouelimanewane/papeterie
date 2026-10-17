import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { audit } from "@/lib/security/audit"
import { backupFileName, RETENTION_DAYS, runBackup, storageConfigured } from "@/lib/security/backup"

export const runtime = "nodejs"
export const maxDuration = 60

/** Historique des sauvegardes (permission « Sécurité »). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "security.manage")
  if (isResponse(auth)) return auth
  try {
    const list = await prisma.backup.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    return NextResponse.json({ backups: list, storage: storageConfigured(), retentionDays: RETENTION_DAYS, dedicatedKey: !!process.env.BACKUP_KEY })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[backups GET]") }
}

/**
 * POST : sauvegarde immédiate. `?download=1` : le fichier chiffré est renvoyé en téléchargement
 * (et conservé aussi dans le stockage s'il est configuré).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "security.manage")
  if (isResponse(auth)) return auth
  try {
    const download = req.nextUrl.searchParams.get("download") === "1"
    const r = await runBackup("manuel", String(auth.email ?? ""), true)
    await audit(req, auth, download ? "backup.download" : "backup.create", r.record?.id ?? null, r.ok ? { taille: r.record?.size, lignes: r.record?.rows, stockée: !!r.record?.location } : { erreur: r.error }, r.ok ? "ok" : "échec")
    if (!r.ok) return NextResponse.json({ error: `Sauvegarde impossible : ${r.error}` }, { status: 500 })
    if (download) {
      return new NextResponse(new Uint8Array(r.file), {
        headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${backupFileName(r.record!.createdAt)}"`, "Cache-Control": "no-store" },
      })
    }
    return NextResponse.json(r.record, { status: 201 })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[backups POST]") }
}
