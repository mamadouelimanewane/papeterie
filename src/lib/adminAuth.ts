import { NextRequest, NextResponse } from "next/server"
import { getToken, type JWT } from "next-auth/jwt"
import { hasPerm, permForApi } from "@/lib/permissions"

/**
 * Vérifie la session admin (cookie NextAuth) et, si demandée, une permission RBAC.
 * Renvoie le jeton, ou une réponse 401/403 à retourner telle quelle.
 */
export async function requireAdmin(req: NextRequest, perm?: string | null): Promise<JWT | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (token.role === "merchant") return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  if (perm && !hasPerm(token.permissions as string[] | undefined, perm)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }
  return token
}

export const isResponse = (x: unknown): x is NextResponse => x instanceof NextResponse

/**
 * Session admin pour une route d'API, avec la même permission que celle exigée par le middleware
 * (`permForApi`). Défense en profondeur : la route reste protégée même si le middleware change.
 */
export async function requireAdminApi(req: Request): Promise<JWT | NextResponse> {
  const { pathname } = new URL(req.url)
  return requireAdmin(req as NextRequest, permForApi(pathname, req.method))
}

/** Jeton admin si la requête vient d'une session admin ayant la permission, sinon null (pas de réponse d'erreur). */
export async function adminTokenOrNull(req: Request, perm?: string | null): Promise<JWT | null> {
  const r = await requireAdmin(req as NextRequest, perm)
  return isResponse(r) ? null : r
}

/**
 * Réponse d'erreur serveur : codes Prisma connus traduits, sinon message générique.
 * Le détail technique part dans les journaux, jamais dans la réponse (il peut révéler la structure de la base).
 */
export function errorResponse(error: unknown, fallback = "Erreur serveur", tag = "[api]") {
  const code = (error as { code?: string })?.code
  if (code === "P2002") return NextResponse.json({ error: "Cette valeur existe déjà (doublon)" }, { status: 409 })
  if (code === "P2025") return NextResponse.json({ error: "Élément introuvable" }, { status: 404 })
  if (code === "P2003") return NextResponse.json({ error: "Élément utilisé ailleurs, suppression impossible" }, { status: 409 })
  console.error(tag, error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}

/**
 * Super-administrateur uniquement (permission « * ») : gestion des comptes admin et des rôles.
 * Un simple droit « settings.manage » ne suffit pas, sinon un sous-admin pourrait se promouvoir super-admin.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<JWT | NextResponse> {
  const auth = await requireAdmin(req)
  if (isResponse(auth)) return auth
  const perms = (auth.permissions as string[] | undefined) ?? []
  if (!perms.includes("*")) return NextResponse.json({ error: "Réservé au super-administrateur" }, { status: 403 })
  return auth
}
