import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { AccountingError } from "./ledger"

/** Garde des API comptables : consultation (accounting.view) ou tenue (accounting.manage). */
export async function accAuth(req: NextRequest, manage = false) {
  const auth = await requireAdmin(req, manage ? "accounting.manage" : "accounting.view")
  if (isResponse(auth)) return { res: auth, who: "" }
  return { res: null, who: String(auth.email ?? auth.name ?? "admin") }
}

/** Erreurs métier (écriture déséquilibrée, exercice clôturé…) en 400 ; le reste en 500. */
export function accError(e: unknown) {
  if (e instanceof AccountingError) return NextResponse.json({ error: e.message }, { status: 400 })
  return errorResponse(e, "Erreur serveur", "[comptabilite]")
}

export const yearParam = (req: NextRequest) => {
  const y = Number(req.nextUrl.searchParams.get("year"))
  return Number.isInteger(y) && y > 2000 && y < 2100 ? y : new Date().getUTCFullYear()
}

export const dateParam = (req: NextRequest, key: string, endOfDay = false) => {
  const v = req.nextUrl.searchParams.get(key)
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  return new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00"}Z`)
}
