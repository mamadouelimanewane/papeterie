import { NextRequest, NextResponse } from "next/server"
import { accAuth, accError } from "@/lib/accounting/api"
import { settleVat } from "@/lib/accounting/closing"
import { AccountingError } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/** POST { year, month } : liquidation de la TVA du mois (vers 4441 TVA due ou 4449 crédit à reporter). */
export async function POST(req: NextRequest) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const year = Number(b.year), month = Number(b.month)
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new AccountingError("Période invalide")
    return NextResponse.json(await settleVat(year, month, who), { status: 201 })
  } catch (e) { return accError(e) }
}
