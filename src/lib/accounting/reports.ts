import { prisma } from "@/lib/prisma"
import { ACC } from "./chart"

/**
 * États comptables SYSCOHADA révisé (système normal) : balance, grand livre, compte de résultat, bilan, TVA.
 * Montants en FCFA entiers. Solde = débit − crédit (positif : débiteur).
 */

export type Period = { year: number; from?: Date; to?: Date }

const yearBounds = (year: number) => ({ start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)) })

type Sum = { account: string; debit: number; credit: number }

/** Totaux débit / crédit par compte sur une période (bornes incluses). */
async function sums(year: number, from: Date, to: Date, opening: boolean): Promise<Sum[]> {
  // Les à-nouveaux (journal AN) sont toujours des soldes d'ouverture, jamais des mouvements de la période
  const rows = await prisma.$queryRaw<{ account: string; debit: bigint; credit: bigint }[]>`
    SELECT l.account, COALESCE(SUM(l.debit),0)::bigint AS debit, COALESCE(SUM(l.credit),0)::bigint AS credit
    FROM "AccLine" l JOIN "AccEntry" e ON e.id = l."entryId"
    WHERE e."fiscalYear" = ${year} AND (
      (e.journal <> 'AN' AND e.date >= ${from} AND e.date <= ${to}) OR (${opening} AND e.journal = 'AN')
    )
    GROUP BY l.account`
  return rows.map((x) => ({ account: x.account, debit: Number(x.debit), credit: Number(x.credit) }))
}

export type BalanceRow = { account: string; label: string; openDebit: number; openCredit: number; moveDebit: number; moveCredit: number; endDebit: number; endCredit: number }

/** Balance générale à 6 colonnes : soldes d'ouverture (à-nouveaux et mouvements antérieurs à la période), mouvements, soldes de clôture. */
export async function trialBalance({ year, from, to }: Period) {
  const { start, end } = yearBounds(year)
  const f = from ?? start, t = to ?? end
  const before = f > start ? await sums(year, start, new Date(f.getTime() - 1), true) : await sums(year, start, new Date(start.getTime() - 1), true)
  const during = await sums(year, f, t, false)
  const labels = new Map((await prisma.accAccount.findMany({ select: { code: true, label: true } })).map((a) => [a.code, a.label]))
  const codes = [...new Set([...before, ...during].map((s) => s.account))].sort()
  const rows: BalanceRow[] = codes.map((code) => {
    const b = before.find((s) => s.account === code), d = during.find((s) => s.account === code)
    const open = (b?.debit ?? 0) - (b?.credit ?? 0)
    const end_ = open + (d?.debit ?? 0) - (d?.credit ?? 0)
    return {
      account: code, label: labels.get(code) ?? "",
      openDebit: Math.max(open, 0), openCredit: Math.max(-open, 0),
      moveDebit: d?.debit ?? 0, moveCredit: d?.credit ?? 0,
      endDebit: Math.max(end_, 0), endCredit: Math.max(-end_, 0),
    }
  })
  const total = (k: keyof BalanceRow) => rows.reduce((s, r) => s + (r[k] as number), 0)
  return { rows, totals: { openDebit: total("openDebit"), openCredit: total("openCredit"), moveDebit: total("moveDebit"), moveCredit: total("moveCredit"), endDebit: total("endDebit"), endCredit: total("endCredit") } }
}

/** Grand livre d'un compte (ou d'une racine, ex. « 411 ») avec solde progressif. */
export async function generalLedger({ year, from, to }: Period, account: string) {
  const { start, end } = yearBounds(year)
  const f = from ?? start, t = to ?? end
  const prefix = account.replace(/[^\d]/g, "")
  const accounts = await prisma.accAccount.findMany({ where: { code: { startsWith: prefix } }, orderBy: { code: "asc" } })
  const lines = await prisma.accLine.findMany({
    where: { account: { startsWith: prefix }, entry: { fiscalYear: year, date: { gte: start, lte: t } } },
    include: { entry: { select: { id: true, number: true, journal: true, date: true, label: true, reference: true } } },
    orderBy: [{ entry: { date: "asc" } }, { entry: { number: "asc" } }],
  })
  return accounts.map((a) => {
    const mine = lines.filter((l) => l.account === a.code)
    const isOpening = (l: (typeof mine)[number]) => l.entry.journal === "AN" || l.entry.date < f
    const opening = mine.filter(isOpening).reduce((s, l) => s + l.debit - l.credit, 0)
    let bal = opening
    const moves = mine.filter((l) => !isOpening(l)).map((l) => {
      bal += l.debit - l.credit
      return { entryId: l.entry.id, number: l.entry.number, journal: l.entry.journal, date: l.entry.date, label: l.label || l.entry.label, reference: l.entry.reference, thirdParty: l.thirdParty, debit: l.debit, credit: l.credit, balance: bal }
    })
    return { account: a.code, label: a.label, opening, moves, totalDebit: moves.reduce((s, m) => s + m.debit, 0), totalCredit: moves.reduce((s, m) => s + m.credit, 0), closing: bal }
  }).filter((a) => a.opening !== 0 || a.moves.length > 0)
}

// ---------------------------------------------------------------------------
// Compte de résultat (SYSCOHADA révisé)
// ---------------------------------------------------------------------------

/** Rubriques de produits (+) et de charges (−) : préfixes de comptes ; le préfixe le plus long l'emporte. */
const PL_RUBRICS: { ref: string; label: string; sign: 1 | -1; prefixes: string[] }[] = [
  { ref: "TA", label: "Ventes de marchandises", sign: 1, prefixes: ["701"] },
  { ref: "RA", label: "Achats de marchandises", sign: -1, prefixes: ["601"] },
  { ref: "RB", label: "Variation de stocks de marchandises", sign: -1, prefixes: ["6031"] },
  { ref: "TB", label: "Ventes de produits fabriqués", sign: 1, prefixes: ["702", "703", "704"] },
  { ref: "TC", label: "Travaux, services vendus", sign: 1, prefixes: ["705", "706"] },
  { ref: "TD", label: "Produits accessoires", sign: 1, prefixes: ["707"] },
  { ref: "TE", label: "Production stockée (ou déstockage)", sign: 1, prefixes: ["73"] },
  { ref: "TF", label: "Production immobilisée", sign: 1, prefixes: ["72"] },
  { ref: "TG", label: "Subventions d'exploitation", sign: 1, prefixes: ["71"] },
  { ref: "TH", label: "Autres produits", sign: 1, prefixes: ["75"] },
  { ref: "TI", label: "Transferts de charges d'exploitation", sign: 1, prefixes: ["781"] },
  { ref: "RC", label: "Achats de matières premières et fournitures liées", sign: -1, prefixes: ["602"] },
  { ref: "RD", label: "Variation de stocks de matières premières", sign: -1, prefixes: ["6032"] },
  { ref: "RE", label: "Autres achats", sign: -1, prefixes: ["604", "605", "608"] },
  { ref: "RF", label: "Variation de stocks d'autres approvisionnements", sign: -1, prefixes: ["6033"] },
  { ref: "RG", label: "Transports", sign: -1, prefixes: ["61"] },
  { ref: "RH", label: "Services extérieurs", sign: -1, prefixes: ["62", "63"] },
  { ref: "RI", label: "Impôts et taxes", sign: -1, prefixes: ["64"] },
  { ref: "RJ", label: "Autres charges", sign: -1, prefixes: ["65"] },
  { ref: "RK", label: "Charges de personnel", sign: -1, prefixes: ["66"] },
  { ref: "TJ", label: "Reprises d'amortissements, provisions et dépréciations", sign: 1, prefixes: ["791", "798", "799"] },
  { ref: "RL", label: "Dotations aux amortissements, provisions et dépréciations", sign: -1, prefixes: ["681", "691"] },
  { ref: "TK", label: "Revenus financiers et assimilés", sign: 1, prefixes: ["77"] },
  { ref: "TL", label: "Reprises de provisions et dépréciations financières", sign: 1, prefixes: ["797"] },
  { ref: "TM", label: "Transferts de charges financières", sign: 1, prefixes: ["787"] },
  { ref: "RM", label: "Frais financiers et charges assimilées", sign: -1, prefixes: ["67"] },
  { ref: "RN", label: "Dotations aux provisions et dépréciations financières", sign: -1, prefixes: ["697"] },
  { ref: "TN", label: "Produits des cessions d'immobilisations", sign: 1, prefixes: ["82"] },
  { ref: "TO", label: "Autres produits HAO", sign: 1, prefixes: ["84", "86", "88"] },
  { ref: "RO", label: "Valeurs comptables des cessions d'immobilisations", sign: -1, prefixes: ["81"] },
  { ref: "RP", label: "Autres charges HAO", sign: -1, prefixes: ["83", "85"] },
  { ref: "RQ", label: "Participation des travailleurs", sign: -1, prefixes: ["87"] },
  { ref: "RS", label: "Impôts sur le résultat", sign: -1, prefixes: ["89"] },
]

function rubricOf<T extends { prefixes: string[] }>(code: string, rubrics: T[]): T | undefined {
  let best: T | undefined, len = 0
  for (const r of rubrics) for (const p of r.prefixes) if (code.startsWith(p) && p.length > len) { best = r; len = p.length }
  return best
}

export type StatementLine = { ref: string; label: string; amount: number; total?: boolean }

/** Compte de résultat : rubriques et soldes intermédiaires XA à XI. */
export async function incomeStatement(p: Period) {
  const { rows } = await trialBalance(p)
  const v: Record<string, number> = Object.fromEntries(PL_RUBRICS.map((r) => [r.ref, 0]))
  const unmapped: string[] = []
  for (const row of rows) {
    const cls = Number(row.account[0])
    if (cls < 6) continue
    const r = rubricOf(row.account, PL_RUBRICS)
    const net = row.endDebit - row.endCredit // charge : débiteur ; produit : créditeur
    if (!r) { if (net) unmapped.push(row.account); continue }
    v[r.ref] += r.sign === 1 ? -net : net
  }
  const XA = v.TA - v.RA - v.RB
  const XB = v.TA + v.TB + v.TC + v.TD
  const XC = XA + v.TB + v.TC + v.TD + v.TE + v.TF + v.TG + v.TH + v.TI - v.RC - v.RD - v.RE - v.RF - v.RG - v.RH - v.RI - v.RJ
  const XD = XC - v.RK
  const XE = XD + v.TJ - v.RL
  const XF = v.TK + v.TL + v.TM - v.RM - v.RN
  const XG = XE + XF
  const XH = v.TN + v.TO - v.RO - v.RP
  const XI = XG + XH - v.RQ - v.RS
  const L = (ref: string): StatementLine => ({ ref, label: PL_RUBRICS.find((r) => r.ref === ref)!.label, amount: v[ref] })
  const T = (ref: string, label: string, amount: number): StatementLine => ({ ref, label, amount, total: true })
  const lines: StatementLine[] = [
    L("TA"), L("RA"), L("RB"), T("XA", "MARGE COMMERCIALE", XA),
    L("TB"), L("TC"), L("TD"), T("XB", "CHIFFRE D'AFFAIRES", XB),
    L("TE"), L("TF"), L("TG"), L("TH"), L("TI"), L("RC"), L("RD"), L("RE"), L("RF"), L("RG"), L("RH"), L("RI"), L("RJ"),
    T("XC", "VALEUR AJOUTÉE", XC), L("RK"), T("XD", "EXCÉDENT BRUT D'EXPLOITATION", XD),
    L("TJ"), L("RL"), T("XE", "RÉSULTAT D'EXPLOITATION", XE),
    L("TK"), L("TL"), L("TM"), L("RM"), L("RN"), T("XF", "RÉSULTAT FINANCIER", XF),
    T("XG", "RÉSULTAT DES ACTIVITÉS ORDINAIRES", XG),
    L("TN"), L("TO"), L("RO"), L("RP"), T("XH", "RÉSULTAT HORS ACTIVITÉS ORDINAIRES", XH),
    L("RQ"), L("RS"), T("XI", "RÉSULTAT NET", XI),
  ]
  return { lines, result: XI, revenue: XB, unmapped }
}

// ---------------------------------------------------------------------------
// Bilan (SYSCOHADA révisé) — montants nets ; les comptes de tiers et de trésorerie sont classés selon leur sens
// ---------------------------------------------------------------------------

type Side = "A" | "P"
type BsRubric = { ref: string; label: string; side: Side; prefixes: string[]; when?: "debit" | "credit"; contra?: string[] }

const BS: BsRubric[] = [
  { ref: "AD", label: "Immobilisations incorporelles", side: "A", prefixes: ["21"], contra: ["281", "291"] },
  { ref: "AI", label: "Immobilisations corporelles", side: "A", prefixes: ["22", "23", "24"], contra: ["282", "283", "284", "292", "293", "294"] },
  { ref: "AP", label: "Avances et acomptes versés sur immobilisations", side: "A", prefixes: ["25"], contra: ["295"] },
  { ref: "AQ", label: "Immobilisations financières", side: "A", prefixes: ["26", "27"], contra: ["296", "297"] },
  { ref: "BA", label: "Actif circulant HAO", side: "A", prefixes: ["485", "488"] },
  { ref: "BB", label: "Stocks et encours", side: "A", prefixes: ["3"], contra: ["39"] },
  { ref: "BH", label: "Fournisseurs, avances versées", side: "A", prefixes: ["409"] },
  { ref: "BI", label: "Clients", side: "A", prefixes: ["41"], when: "debit", contra: ["491"] },
  { ref: "BJ", label: "Autres créances", side: "A", prefixes: ["42", "43", "44", "45", "46", "47"], when: "debit" },
  { ref: "BQ", label: "Titres de placement", side: "A", prefixes: ["50"], contra: ["59"] },
  { ref: "BR", label: "Valeurs à encaisser", side: "A", prefixes: ["51"] },
  { ref: "BS", label: "Banques, chèques postaux, caisse et assimilés", side: "A", prefixes: ["52", "53", "54", "55", "57", "58"], when: "debit" },
  { ref: "BU", label: "Écart de conversion — Actif", side: "A", prefixes: ["478"] },
  { ref: "CA", label: "Capital", side: "P", prefixes: ["101", "102", "103", "104"] },
  { ref: "CB", label: "Apporteurs capital non appelé (−)", side: "P", prefixes: ["109"] },
  { ref: "CD", label: "Primes liées au capital social", side: "P", prefixes: ["105"] },
  { ref: "CE", label: "Écarts de réévaluation", side: "P", prefixes: ["106"] },
  { ref: "CF", label: "Réserves indisponibles", side: "P", prefixes: ["111", "112", "113"] },
  { ref: "CG", label: "Réserves libres", side: "P", prefixes: ["118"] },
  { ref: "CH", label: "Report à nouveau (+ ou −)", side: "P", prefixes: ["12"] },
  { ref: "CJ", label: "Résultat net de l'exercice (bénéfice + ou perte −)", side: "P", prefixes: ["13"] },
  { ref: "CL", label: "Subventions d'investissement", side: "P", prefixes: ["14"] },
  { ref: "CM", label: "Provisions réglementées", side: "P", prefixes: ["15"] },
  { ref: "DA", label: "Emprunts et dettes financières diverses", side: "P", prefixes: ["16", "18"] },
  { ref: "DB", label: "Dettes de location-acquisition", side: "P", prefixes: ["17"] },
  { ref: "DC", label: "Provisions pour risques et charges", side: "P", prefixes: ["19"] },
  { ref: "DH", label: "Dettes circulantes HAO", side: "P", prefixes: ["481", "482", "484"] },
  { ref: "DI", label: "Clients, avances reçues", side: "P", prefixes: ["41"], when: "credit" },
  { ref: "DJ", label: "Fournisseurs d'exploitation", side: "P", prefixes: ["40"], when: "credit" },
  { ref: "DK", label: "Dettes fiscales et sociales", side: "P", prefixes: ["42", "43", "44"], when: "credit" },
  { ref: "DM", label: "Autres dettes", side: "P", prefixes: ["45", "46", "47"], when: "credit" },
  { ref: "DN", label: "Provisions pour risques à court terme", side: "P", prefixes: ["499"] },
  { ref: "DQ", label: "Banques, crédits d'escompte", side: "P", prefixes: ["565"] },
  { ref: "DR", label: "Banques, établissements financiers et crédits de trésorerie", side: "P", prefixes: ["52", "53", "55", "56", "57", "58"], when: "credit" },
  { ref: "DV", label: "Écart de conversion — Passif", side: "P", prefixes: ["479"] },
]

/** Bilan au dernier jour de la période. Exercice non clôturé : le résultat provisoire est porté en CJ. */
export async function balanceSheet(p: Period) {
  const { rows } = await trialBalance(p)
  const amounts: Record<string, number> = Object.fromEntries(BS.map((r) => [r.ref, 0]))
  const unmapped: string[] = []
  for (const row of rows) {
    if (Number(row.account[0]) > 5) continue
    const bal = row.endDebit - row.endCredit
    if (!bal) continue
    // Amortissements / dépréciations : viennent en déduction de leur rubrique d'actif
    const contraOf = BS.find((r) => r.contra?.some((c) => row.account.startsWith(c)))
    if (contraOf) { amounts[contraOf.ref] += bal; continue }
    const dir = bal > 0 ? "debit" : "credit"
    const candidates = BS.filter((r) => !r.when || r.when === dir)
    const r = rubricOf(row.account, candidates)
    if (!r) { unmapped.push(row.account); continue }
    amounts[r.ref] += r.side === "A" ? bal : -bal
  }
  const pl = await incomeStatement(p)
  const year = await prisma.accFiscalYear.findUnique({ where: { year: p.year } })
  // Résultat de la période (comptes de gestion non soldés) ajouté aux comptes 13 éventuels
  amounts.CJ += pl.result
  const sum = (refs: string[]) => refs.reduce((s, r) => s + amounts[r], 0)
  const A = (ref: string): StatementLine => ({ ref, label: BS.find((r) => r.ref === ref)!.label, amount: amounts[ref] })
  const T = (ref: string, label: string, amount: number): StatementLine => ({ ref, label, amount, total: true })
  const AZ = sum(["AD", "AI", "AP", "AQ"]), BK = sum(["BA", "BB", "BH", "BI", "BJ"]), BT = sum(["BQ", "BR", "BS"])
  const CP = sum(["CA", "CB", "CD", "CE", "CF", "CG", "CH", "CJ", "CL", "CM"]), DD = sum(["DA", "DB", "DC"])
  const DP = sum(["DH", "DI", "DJ", "DK", "DM", "DN"]), DT = sum(["DQ", "DR"])
  const assets: StatementLine[] = [A("AD"), A("AI"), A("AP"), A("AQ"), T("AZ", "TOTAL ACTIF IMMOBILISÉ", AZ),
    A("BA"), A("BB"), A("BH"), A("BI"), A("BJ"), T("BK", "TOTAL ACTIF CIRCULANT", BK),
    A("BQ"), A("BR"), A("BS"), T("BT", "TOTAL TRÉSORERIE — ACTIF", BT), A("BU"), T("BZ", "TOTAL GÉNÉRAL", AZ + BK + BT + amounts.BU)]
  const liabilities: StatementLine[] = [A("CA"), A("CB"), A("CD"), A("CE"), A("CF"), A("CG"), A("CH"), A("CJ"), A("CL"), A("CM"),
    T("CP", "TOTAL CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES", CP), A("DA"), A("DB"), A("DC"), T("DD", "TOTAL DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES", DD),
    T("DF", "TOTAL RESSOURCES STABLES", CP + DD), A("DH"), A("DI"), A("DJ"), A("DK"), A("DM"), A("DN"), T("DP", "TOTAL PASSIF CIRCULANT", DP),
    A("DQ"), A("DR"), T("DT", "TOTAL TRÉSORERIE — PASSIF", DT), A("DV"), T("DZ", "TOTAL GÉNÉRAL", CP + DD + DP + DT + amounts.DV)]
  const totalA = AZ + BK + BT + amounts.BU, totalP = CP + DD + DP + DT + amounts.DV
  return { assets, liabilities, totalAssets: totalA, totalLiabilities: totalP, balanced: totalA === totalP, provisional: year?.status !== "Clôturé", result: pl.result, unmapped }
}

// ---------------------------------------------------------------------------
// TVA
// ---------------------------------------------------------------------------

/** Déclaration de TVA d'une période : bases et TVA collectée par taux, TVA déductible, TVA nette. */
export async function vatReturn(from: Date, to: Date) {
  const lines = await prisma.accLine.findMany({
    where: { entry: { date: { gte: from, lte: to } }, OR: [{ account: { startsWith: "443" } }, { account: { startsWith: "445" } }, { account: { startsWith: "70" } }] },
    select: { account: true, debit: true, credit: true, vatRate: true, entry: { select: { sourceType: true } } },
  })
  // Mois liquidé : écriture de liquidation datée du dernier jour du mois de début de période
  const monthEnd = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  const settled = !!(await prisma.accEntry.findFirst({ where: { sourceType: "tva", date: { gte: from, lte: monthEnd } }, select: { id: true } }))
  const rates = new Map<number, { base: number; vat: number }>()
  let deductible = 0
  for (const l of lines) {
    if (l.entry.sourceType === "tva") continue // écritures de liquidation de TVA exclues des bases
    const net = l.credit - l.debit
    if (l.account.startsWith("70")) {
      const k = l.vatRate ?? -1
      const cur = rates.get(k) ?? { base: 0, vat: 0 }
      cur.base += net; rates.set(k, cur)
    } else if (l.account.startsWith("443")) {
      const k = l.vatRate ?? -1
      const cur = rates.get(k) ?? { base: 0, vat: 0 }
      cur.vat += net; rates.set(k, cur)
    } else deductible += l.debit - l.credit
  }
  const collected = [...rates.values()].reduce((s, r) => s + r.vat, 0)
  const byRate = [...rates.entries()].map(([rate, v]) => ({ rate: rate < 0 ? null : rate, ...v })).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
  const prev = await prisma.accLine.aggregate({ where: { account: ACC.vatCredit, entry: { date: { lt: from } } }, _sum: { debit: true, credit: true } })
  const creditCarried = Math.max(0, (prev._sum.debit ?? 0) - (prev._sum.credit ?? 0))
  const net = collected - deductible - creditCarried
  return { byRate, collected, deductible, creditCarried, net, toPay: Math.max(net, 0), creditToCarry: Math.max(-net, 0), settled }
}
