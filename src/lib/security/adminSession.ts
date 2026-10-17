import { prisma } from "@/lib/prisma"
import { SUPER_ROLES } from "@/lib/permissions"
import { getSetting } from "@/lib/appSettings"

/**
 * Contrôle « en direct » d'une session administrateur (jeton NextAuth) :
 *  - le compte existe toujours et est actif ;
 *  - ses sessions n'ont pas été fermées depuis (déconnexion forcée, changement de mot de passe) ;
 *  - ses droits sont relus depuis son rôle actuel (un droit retiré l'est tout de suite, sans attendre 12 h) ;
 *  - double authentification exigée par la politique de sécurité mais pas encore activée.
 * Résultat mis en cache 15 s par compte pour ne pas interroger la base à chaque requête.
 */

export type LiveAdmin = { id: string; email: string; role: string; permissions: string[]; twoFactorEnabled: boolean; needs2fa: boolean }

export async function resolvePermissions(role: string): Promise<string[]> {
  if (SUPER_ROLES.includes(role)) return ["*"]
  try {
    const r = await prisma.role.findUnique({ where: { name: role } })
    if (!r || r.status === "Inactive") return []
    return Array.isArray(r.permissions) ? (r.permissions as string[]) : []
  } catch {
    return [] // échec fermé : en cas d'erreur de base, aucun droit
  }
}

/** Le rôle attribué doit exister (ou être un rôle de super-administrateur). */
export async function validRole(role: unknown) {
  const r = String(role ?? "")
  if (SUPER_ROLES.includes(r)) return true
  return !!(await prisma.role.findUnique({ where: { name: r } }))
}

export async function securityPolicy() {
  const s = (await getSetting("security")) as { require2fa?: boolean }
  return { require2fa: s.require2fa === true }
}

const cache = new Map<string, { at: number; value: LiveAdmin | null; iat: number }>()
const TTL = 15_000

/** À appeler après une modification d'un compte ou d'un rôle (effet immédiat sur cette instance). */
export function invalidateAdminCache(id?: string) {
  if (id) cache.delete(id)
  else cache.clear()
}

export async function liveAdmin(token: { sub?: string; id?: unknown; email?: unknown; iat?: unknown; role?: unknown; loginAt?: unknown }): Promise<LiveAdmin | null> {
  const id = String(token.sub ?? token.id ?? "")
  // Heure de connexion à la milliseconde (posée à la connexion) ; à défaut, date d'émission du jeton (à la seconde)
  const iat = Number(token.loginAt ?? 0) || Number(token.iat ?? 0) * 1000
  // Compte de secours défini par variables d'environnement (ADMIN_EMAIL / ADMIN_PASSWORD) : pas de fiche en base
  if (id === "admin-env") return { id, email: String(token.email ?? ""), role: "admin", permissions: ["*"], twoFactorEnabled: false, needs2fa: false }
  if (!id) return null
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < TTL && hit.iat === iat) return hit.value
  const a = await prisma.admin.findUnique({ where: { id }, select: { id: true, email: true, role: true, status: true, sessionsRevokedAt: true, twoFactorEnabled: true } })
  let value: LiveAdmin | null = null
  const revokedAt = a?.sessionsRevokedAt?.getTime() ?? 0
  if (a && a.status === "Active" && !(revokedAt && iat && iat < revokedAt)) {
    const policy = await securityPolicy()
    value = { id: a.id, email: a.email, role: a.role, permissions: await resolvePermissions(a.role), twoFactorEnabled: a.twoFactorEnabled, needs2fa: policy.require2fa && !a.twoFactorEnabled }
  }
  cache.set(id, { at: Date.now(), value, iat })
  return value
}
