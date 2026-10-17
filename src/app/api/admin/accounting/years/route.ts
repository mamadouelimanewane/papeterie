import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { closingCheck, depreciationFor } from "@/lib/accounting/closing"
import { ensureFiscalYear } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/** Exercices, avec contrôles de clôture et dotations prévues pour l'exercice ouvert le plus ancien. */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    await ensureFiscalYear(new Date().getUTCFullYear())
    const years = await prisma.accFiscalYear.findMany({ orderBy: { year: "desc" } })
    const open = [...years].reverse().find((y) => y.status === "Ouvert")
    const check = open ? await closingCheck(open.year) : null
    const depreciation = open ? (await depreciationFor(open.year)).map((d) => ({ label: d.asset.label, amount: d.amount })) : []
    const counts = await prisma.accEntry.groupBy({ by: ["fiscalYear"], _count: { _all: true } })
    return NextResponse.json({
      years: years.map((y) => ({ ...y, entries: counts.find((c) => c.fiscalYear === y.year)?._count._all ?? 0 })),
      next: open ? { year: open.year, ...check, depreciation } : null,
    })
  } catch (e) { return accError(e) }
}
