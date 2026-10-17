import { prisma } from "@/lib/prisma"
import { ACC, isBalanceSheet } from "./chart"
import { AccountingError, createEntry, ensureFiscalYear, type LineInput } from "./ledger"
import { incomeStatement, trialBalance } from "./reports"

/** Liquidation de la TVA d'un mois : solde les comptes 443 / 445 vers 4441 (TVA due) ou 4449 (crédit à reporter). */
export async function settleVat(year: number, month: number, createdBy: string) {
  const period = `${year}-${String(month).padStart(2, "0")}`
  if (await prisma.accEntry.findUnique({ where: { sourceType_sourceId: { sourceType: "tva", sourceId: period } } })) {
    throw new AccountingError("TVA de ce mois déjà liquidée : une opération tardive se régularise par une écriture OD (443 / 445 / 4441)")
  }
  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  const sums = await prisma.accLine.groupBy({
    by: ["account"],
    where: { entry: { date: { gte: from, lte: to }, NOT: { sourceType: "tva" } }, OR: [{ account: { startsWith: "443" } }, { account: { startsWith: "445" } }] },
    _sum: { debit: true, credit: true },
  })
  const prev = await prisma.accLine.aggregate({ where: { account: ACC.vatCredit, entry: { date: { lt: from } } }, _sum: { debit: true, credit: true } })
  const carried = Math.max(0, (prev._sum.debit ?? 0) - (prev._sum.credit ?? 0))
  const lines: LineInput[] = []
  let net = 0
  for (const s of sums) {
    const bal = (s._sum.debit ?? 0) - (s._sum.credit ?? 0)
    if (!bal) continue
    // On solde chaque compte : 443 (créditeur) au débit, 445 (débiteur) au crédit
    lines.push(bal < 0 ? { account: s.account, debit: -bal, label: "Liquidation TVA" } : { account: s.account, credit: bal, label: "Liquidation TVA" })
    net -= bal
  }
  if (carried) { lines.push({ account: ACC.vatCredit, credit: carried, label: "Imputation du crédit de TVA antérieur" }); net -= carried }
  if (net > 0) lines.push({ account: ACC.vatDue, credit: net, label: "TVA due" })
  else if (net < 0) lines.push({ account: ACC.vatCredit, debit: -net, label: "Crédit de TVA à reporter" })
  if (lines.length < 2) throw new AccountingError("Aucune TVA à liquider sur ce mois")
  return createEntry({ journal: "OD", date: to, label: `Liquidation de la TVA ${period}`, reference: `TVA ${period}`, sourceType: "tva", sourceId: period, createdBy, lines })
}

/** Dotation linéaire de l'exercice (prorata temporis en jours la première année, plafonnée à la valeur restante). */
export async function depreciationFor(year: number) {
  const assets = await prisma.accFixedAsset.findMany({ where: { status: "En service" } })
  const yStart = Date.UTC(year, 0, 1), yEnd = Date.UTC(year, 11, 31, 23, 59, 59)
  const out: { asset: (typeof assets)[number]; amount: number; already: number }[] = []
  for (const a of assets) {
    const acq = a.acquisitionDate.getTime()
    if (acq > yEnd) continue
    const annual = a.cost / a.durationYears
    const startMs = Math.max(acq, yStart)
    const days = Math.floor((yEnd - startMs) / 86_400_000) + 1
    const prior = await prisma.accLine.aggregate({ where: { account: a.amortAccount, entry: { sourceType: "amortissement", sourceId: { startsWith: `${a.id}:` }, NOT: { sourceId: `${a.id}:${year}` } } }, _sum: { credit: true } })
    const already = prior._sum.credit ?? 0
    const amount = Math.max(0, Math.min(Math.round((annual * days) / 365), a.cost - already))
    if (amount > 0) out.push({ asset: a, amount, already })
  }
  return out
}

export async function postDepreciation(year: number, createdBy: string) {
  const items = await depreciationFor(year)
  let n = 0
  for (const { asset, amount } of items) {
    await createEntry({
      journal: "OD", date: new Date(Date.UTC(year, 11, 31)), label: `Dotation aux amortissements ${year} — ${asset.label}`, reference: `AMORT ${year}`,
      sourceType: "amortissement", sourceId: `${asset.id}:${year}`, createdBy,
      lines: [{ account: ACC.depreciationExpense, debit: amount, label: asset.label }, { account: asset.amortAccount, credit: amount, label: asset.label }],
    })
    n++
  }
  return n
}

/** Contrôles avant clôture. */
export async function closingCheck(year: number) {
  const fy = await ensureFiscalYear(year)
  const { totals } = await trialBalance({ year })
  const pl = await incomeStatement({ year })
  const pendingDepreciation = (await depreciationFor(year)).filter((d) => d.amount > 0)
  const prevOpen = await prisma.accFiscalYear.findFirst({ where: { year: { lt: year }, status: "Ouvert" } })
  return {
    status: fy.status, result: pl.result,
    balanced: totals.moveDebit === totals.moveCredit,
    pendingDepreciation: pendingDepreciation.length,
    previousOpen: prevOpen?.year ?? null,
  }
}

/**
 * Clôture : l'exercice est verrouillé ; les soldes des comptes de bilan (classes 1 à 5) sont reportés en à-nouveaux
 * au 1er janvier suivant et le résultat est porté en 1301 / 1309 (résultat en instance d'affectation).
 */
export async function closeYear(year: number, createdBy: string) {
  const check = await closingCheck(year)
  if (check.status !== "Ouvert") throw new AccountingError("Exercice déjà clôturé")
  if (check.previousOpen) throw new AccountingError(`Clôturez d'abord l'exercice ${check.previousOpen}`)
  if (!check.balanced) throw new AccountingError("La balance n'est pas équilibrée : clôture impossible")
  const { rows } = await trialBalance({ year })
  const lines: LineInput[] = []
  for (const r of rows) {
    if (!isBalanceSheet(r.account)) continue
    const bal = r.endDebit - r.endCredit
    if (bal > 0) lines.push({ account: r.account, debit: bal, label: "Report à nouveau" })
    else if (bal < 0) lines.push({ account: r.account, credit: -bal, label: "Report à nouveau" })
  }
  if (check.result > 0) lines.push({ account: ACC.resultProfit, credit: check.result, label: `Résultat ${year} : bénéfice` })
  else if (check.result < 0) lines.push({ account: ACC.resultLoss, debit: -check.result, label: `Résultat ${year} : perte` })
  await ensureFiscalYear(year + 1)
  if (lines.length >= 2) {
    await createEntry({ journal: "AN", date: new Date(Date.UTC(year + 1, 0, 1)), label: `À-nouveaux de l'exercice ${year}`, reference: `AN ${year + 1}`, sourceType: "a-nouveau", sourceId: String(year), createdBy, lines })
  }
  await prisma.accFiscalYear.update({ where: { year }, data: { status: "Clôturé", closedAt: new Date(), result: check.result } })
  return { result: check.result, carried: lines.length }
}

/** Réouverture (erreur constatée après clôture) : supprime les à-nouveaux générés, si l'exercice suivant n'est pas clôturé. */
export async function reopenYear(year: number) {
  const next = await prisma.accFiscalYear.findUnique({ where: { year: year + 1 } })
  if (next?.status === "Clôturé") throw new AccountingError(`L'exercice ${year + 1} est clôturé : rouvrez-le d'abord`)
  await prisma.accEntry.deleteMany({ where: { sourceType: "a-nouveau", sourceId: String(year) } })
  await prisma.accFiscalYear.update({ where: { year }, data: { status: "Ouvert", closedAt: null, result: null } })
}
