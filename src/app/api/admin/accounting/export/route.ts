import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError, yearParam } from "@/lib/accounting/api"
import { JOURNALS } from "@/lib/accounting/chart"
import { trialBalance } from "@/lib/accounting/reports"

export const runtime = "nodejs"

const csvCell = (v: unknown) => {
  const s = String(v ?? "")
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "")
const csv = (rows: unknown[][], name: string) =>
  new NextResponse("﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  })

/**
 * Exports pour l'expert-comptable :
 *  ?type=entries : toutes les écritures de l'exercice, une ligne par mouvement (format « fichier des écritures »)
 *  ?type=balance : balance générale à 6 colonnes
 */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    const year = yearParam(req)
    if (req.nextUrl.searchParams.get("type") === "balance") {
      const { rows, totals } = await trialBalance({ year })
      return csv([
        ["Compte", "Intitulé", "Solde ouverture débit", "Solde ouverture crédit", "Mouvements débit", "Mouvements crédit", "Solde final débit", "Solde final crédit"],
        ...rows.map((r) => [r.account, r.label, r.openDebit, r.openCredit, r.moveDebit, r.moveCredit, r.endDebit, r.endCredit]),
        ["TOTAL", "", totals.openDebit, totals.openCredit, totals.moveDebit, totals.moveCredit, totals.endDebit, totals.endCredit],
      ], `balance-${year}.csv`)
    }
    const labels = new Map((await prisma.accAccount.findMany({ select: { code: true, label: true } })).map((a) => [a.code, a.label]))
    const entries = await prisma.accEntry.findMany({ where: { fiscalYear: year }, include: { lines: true }, orderBy: [{ journal: "asc" }, { number: "asc" }] })
    const rows: unknown[][] = [["JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "ValidDate", "Origine"]]
    for (const e of entries) for (const l of e.lines) {
      rows.push([e.journal, JOURNALS.find((j) => j.code === e.journal)?.label ?? e.journal, e.number, ymd(e.date), l.account, labels.get(l.account) ?? "", l.thirdParty ?? "", e.reference ?? "", ymd(e.date), l.label || e.label, l.debit, l.credit, ymd(e.createdAt), e.sourceType ?? "saisie"])
    }
    return csv(rows, `ecritures-${year}.csv`)
  } catch (e) { return accError(e) }
}
