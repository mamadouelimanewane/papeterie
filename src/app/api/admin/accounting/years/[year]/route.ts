import { NextRequest, NextResponse } from "next/server"
import { accAuth, accError } from "@/lib/accounting/api"
import { closeYear, postDepreciation, reopenYear } from "@/lib/accounting/closing"
import { AccountingError } from "@/lib/accounting/ledger"
import { syncAccounting } from "@/lib/accounting/sync"

export const runtime = "nodejs"
export const maxDuration = 60

/** POST { action: "depreciation" | "close" | "reopen" } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ year: string }> }) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const year = Number((await params).year)
    if (!Number.isInteger(year)) throw new AccountingError("Exercice invalide")
    const { action } = await req.json().catch(() => ({}))
    if (action === "depreciation") return NextResponse.json({ posted: await postDepreciation(year, who) })
    if (action === "close") {
      await syncAccounting() // dernières opérations de l'exercice comptabilisées avant le verrouillage
      return NextResponse.json(await closeYear(year, who))
    }
    if (action === "reopen") { await reopenYear(year); return NextResponse.json({ ok: true }) }
    throw new AccountingError("Action invalide")
  } catch (e) { return accError(e) }
}
