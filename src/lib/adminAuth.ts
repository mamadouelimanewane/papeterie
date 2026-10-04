import { NextRequest, NextResponse } from "next/server"
import { getToken, type JWT } from "next-auth/jwt"
import { hasPerm } from "@/lib/permissions"

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

export function errorResponse(error: unknown, fallback = "Erreur serveur") {
  const code = (error as { code?: string })?.code
  if (code === "P2002") return NextResponse.json({ error: "Cette valeur existe déjà (doublon)" }, { status: 409 })
  if (code === "P2025") return NextResponse.json({ error: "Élément introuvable" }, { status: 404 })
  if (code === "P2003") return NextResponse.json({ error: "Élément utilisé ailleurs, suppression impossible" }, { status: 409 })
  console.error("[admin]", error)
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 500 })
}
