import { NextRequest, NextResponse } from "next/server"
import { accAuth, accError, dateParam, yearParam } from "@/lib/accounting/api"
import { balanceSheet, generalLedger, incomeStatement, trialBalance, vatReturn } from "@/lib/accounting/reports"
import { getAccountingConfig } from "@/lib/accounting/config"

export const runtime = "nodejs"

/** GET ?type=balance|ledger|income|bilan|vat&year=&from=&to=&account= */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    const q = req.nextUrl.searchParams
    const year = yearParam(req)
    const from = dateParam(req, "from"), to = dateParam(req, "to", true)
    const company = (await getAccountingConfig()).company
    switch (q.get("type")) {
      case "balance": return NextResponse.json({ company, ...(await trialBalance({ year, from, to })) })
      case "ledger": return NextResponse.json({ company, accounts: await generalLedger({ year, from, to }, q.get("account") || "") })
      case "income": return NextResponse.json({ company, ...(await incomeStatement({ year, to })) })
      case "bilan": return NextResponse.json({ company, ...(await balanceSheet({ year, to })) })
      case "vat": {
        const f = from ?? new Date(Date.UTC(year, 0, 1)), t = to ?? new Date(Date.UTC(year, 11, 31, 23, 59, 59))
        return NextResponse.json({ company, ...(await vatReturn(f, t)) })
      }
      default: return NextResponse.json({ error: "Type d'état inconnu" }, { status: 400 })
    }
  } catch (e) { return accError(e) }
}
