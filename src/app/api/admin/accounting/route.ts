import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError, yearParam } from "@/lib/accounting/api"
import { syncAccounting } from "@/lib/accounting/sync"
import { balanceSheet, incomeStatement, vatReturn } from "@/lib/accounting/reports"
import { ensureChart, ensureFiscalYear } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/** Tableau de bord comptable de l'exercice (les opérations récentes sont comptabilisées au passage, 1 fois / min). */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    await ensureChart()
    const year = yearParam(req)
    await ensureFiscalYear(year)
    const sync = await syncAccounting(60_000)
    const [pl, bs, years, last] = await Promise.all([
      incomeStatement({ year }), balanceSheet({ year }),
      prisma.accFiscalYear.findMany({ orderBy: { year: "desc" } }),
      prisma.accEntry.findMany({ where: { fiscalYear: year }, orderBy: [{ date: "desc" }, { number: "desc" }], take: 8, include: { lines: { select: { debit: true } } } }),
    ])
    const now = new Date()
    const m0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const vat = await vatReturn(m0, now)
    const treasury = bs.assets.find((l) => l.ref === "BS")?.amount ?? 0
    const clients = bs.assets.find((l) => l.ref === "BI")?.amount ?? 0
    const suppliers = bs.liabilities.find((l) => l.ref === "DJ")?.amount ?? 0
    return NextResponse.json({
      year, years, status: years.find((y) => y.year === year)?.status ?? "Ouvert",
      revenue: pl.revenue, result: pl.result, margin: pl.lines.find((l) => l.ref === "XA")?.amount ?? 0,
      treasury, clients, suppliers, vatMonth: vat.net, balanced: bs.balanced,
      sync: { created: sync.created, errors: sync.errors.slice(0, 20), manual: sync.manual.slice(0, 50) },
      last: last.map((e) => ({ id: e.id, number: e.number, journal: e.journal, date: e.date, label: e.label, amount: e.lines.reduce((s, l) => s + l.debit, 0), auto: !!e.sourceType })),
    })
  } catch (e) { return accError(e) }
}
