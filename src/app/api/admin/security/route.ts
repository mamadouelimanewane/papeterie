import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { resetSettingsCache } from "@/lib/appSettings"
import { audit } from "@/lib/security/audit"
import { invalidateAdminCache, securityPolicy } from "@/lib/security/adminSession"

/**
 * Politique de sécurité — super-administrateur : double authentification obligatoire.
 * GET renvoie aussi un état des lieux (comptes sans 2FA, sessions, compte de secours actif, sauvegardes).
 */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const policy = await securityPolicy()
    const [admins, without2fa, inactive, lastBackup, failures24h] = await Promise.all([
      prisma.admin.count({ where: { status: "Active" } }),
      prisma.admin.count({ where: { status: "Active", twoFactorEnabled: false } }),
      prisma.admin.count({ where: { status: "Active", OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: new Date(Date.now() - 90 * 86_400_000) } }] } }),
      prisma.backup.findFirst({ where: { status: "ok" }, orderBy: { createdAt: "desc" } }),
      prisma.auditLog.count({ where: { action: { in: ["login.failure", "login.2fa_failure"] }, at: { gte: new Date(Date.now() - 86_400_000) } } }),
    ])
    return NextResponse.json({
      policy,
      status: {
        admins, without2fa, inactive, failures24h,
        envAdmin: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
        backupStorage: !!process.env.BLOB_READ_WRITE_TOKEN,
        dedicatedBackupKey: !!process.env.BACKUP_KEY,
        lastBackup: lastBackup?.createdAt ?? null,
      },
    })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[security GET]") }
}

export async function PUT(req: NextRequest) {
  const auth = await requireSuperAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const b = await req.json().catch(() => ({}))
    const value = { require2fa: b.require2fa === true }
    await prisma.appSetting.upsert({ where: { key: "security" }, update: { value }, create: { key: "security", value } })
    resetSettingsCache("security")
    invalidateAdminCache()
    await audit(req, auth, "security.update", null, value)
    return NextResponse.json(value)
  } catch (e) { return errorResponse(e, "Erreur serveur", "[security PUT]") }
}
