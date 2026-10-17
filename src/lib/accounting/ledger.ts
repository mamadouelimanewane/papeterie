import { prisma } from "@/lib/prisma"
import { CHART, JOURNAL_CODES, SYSTEM_ACCOUNTS } from "./chart"

/** Client Prisma ou transaction en cours (seuls les modèles comptables sont utilisés). */
type Tx = { accFiscalYear: typeof prisma.accFiscalYear; accAccount: typeof prisma.accAccount }

export class AccountingError extends Error {}

export type LineInput = { account: string; debit?: number; credit?: number; label?: string | null; thirdParty?: string | null; vatRate?: number | null }
export type EntryInput = {
  journal: string
  date: Date
  label: string
  reference?: string | null
  sourceType?: string | null
  sourceId?: string | null
  createdBy?: string | null
  lines: LineInput[]
}

/** Installe le plan comptable SYSCOHADA (comptes manquants seulement). */
export async function ensureChart() {
  const n = await prisma.accAccount.count({ where: { code: { in: CHART.map(([c]) => c) } } })
  if (n >= CHART.length) return
  await prisma.accAccount.createMany({
    data: CHART.map(([code, label]) => ({ code, label, isSystem: SYSTEM_ACCOUNTS.has(code) })),
    skipDuplicates: true,
  })
}

/** Exercice de l'année (créé ouvert s'il n'existe pas). */
export async function ensureFiscalYear(year: number, tx: Tx = prisma) {
  const fy = await tx.accFiscalYear.findUnique({ where: { year } })
  if (fy) return fy
  return tx.accFiscalYear.upsert({
    where: { year },
    update: {},
    create: { year, startDate: new Date(Date.UTC(year, 0, 1)), endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) },
  })
}

const int = (v: unknown) => Math.round(Number(v) || 0)

/** Contrôles d'une écriture : lignes valides, partie double équilibrée, comptes existants. */
export async function validateEntry(e: EntryInput, tx: Tx = prisma): Promise<LineInput[]> {
  if (!JOURNAL_CODES.includes(e.journal)) throw new AccountingError("Journal inconnu")
  if (!(e.date instanceof Date) || isNaN(e.date.getTime())) throw new AccountingError("Date invalide")
  if (!e.label?.trim()) throw new AccountingError("Libellé de l'écriture obligatoire")
  const lines = e.lines
    .map((l) => ({ ...l, account: String(l.account ?? "").trim(), debit: int(l.debit), credit: int(l.credit) }))
    .filter((l) => l.debit !== 0 || l.credit !== 0)
  if (lines.length < 2) throw new AccountingError("Une écriture comporte au moins deux lignes")
  for (const l of lines) {
    if (l.debit < 0 || l.credit < 0) throw new AccountingError("Montants négatifs interdits : inversez le sens (débit / crédit)")
    if (l.debit > 0 && l.credit > 0) throw new AccountingError(`Compte ${l.account} : une ligne est soit au débit, soit au crédit`)
  }
  const d = lines.reduce((s, l) => s + l.debit!, 0)
  const c = lines.reduce((s, l) => s + l.credit!, 0)
  if (d !== c) throw new AccountingError(`Écriture déséquilibrée : débit ${d} ≠ crédit ${c}`)
  const codes = [...new Set(lines.map((l) => l.account))]
  const found = await tx.accAccount.findMany({ where: { code: { in: codes }, isActive: true }, select: { code: true } })
  const missing = codes.filter((k) => !found.some((f) => f.code === k))
  if (missing.length) throw new AccountingError(`Compte(s) inexistant(s) ou inactif(s) : ${missing.join(", ")}`)
  return lines
}

/**
 * Enregistre une écriture numérotée par journal et par exercice (VE-2026-000001…).
 * Écriture automatique déjà passée (même origine) : renvoie l'existante, sans doublon.
 */
export async function createEntry(e: EntryInput) {
  if (e.sourceType && e.sourceId) {
    const existing = await prisma.accEntry.findUnique({ where: { sourceType_sourceId: { sourceType: e.sourceType, sourceId: e.sourceId } }, include: { lines: true } })
    if (existing) return existing
  }
  const year = e.date.getUTCFullYear()
  return prisma.$transaction(async (tx) => {
    const lines = await validateEntry(e, tx)
    const fy = await ensureFiscalYear(year, tx)
    if (fy.status !== "Ouvert") throw new AccountingError(`L'exercice ${year} est clôturé : aucune écriture possible`)
    // Numéro séquentiel sans doublon même avec des saisies simultanées
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`acc:${e.journal}:${year}`}))`
    const prefix = `${e.journal}-${year}-`
    const last = await tx.accEntry.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } })
    const seq = (last ? Number(last.number.slice(prefix.length)) : 0) + 1
    return tx.accEntry.create({
      data: {
        journal: e.journal, number: prefix + String(seq).padStart(6, "0"), date: e.date, label: e.label.trim().slice(0, 200),
        reference: e.reference?.slice(0, 80) ?? null, fiscalYear: year, sourceType: e.sourceType ?? null, sourceId: e.sourceId ?? null,
        createdBy: e.createdBy ?? null,
        lines: { create: lines.map((l) => ({ account: l.account, debit: l.debit!, credit: l.credit!, label: l.label?.slice(0, 200) ?? null, thirdParty: l.thirdParty?.slice(0, 120) ?? null, vatRate: l.vatRate ?? null })) },
      },
      include: { lines: true },
    })
  }, { timeout: 20000 })
}

/** Les montants ventilés (HT par taux, TVA) arrondis au franc tombent juste : l'écart d'arrondi va sur la plus grosse ligne. */
export function balanceLines(lines: LineInput[]): LineInput[] {
  const d = lines.reduce((s, l) => s + int(l.debit), 0)
  const c = lines.reduce((s, l) => s + int(l.credit), 0)
  const diff = d - c
  if (diff === 0) return lines
  const side = diff > 0 ? "credit" : "debit"
  const target = lines.filter((l) => int(l[side]) > 0).sort((a, b) => int(b[side]) - int(a[side]))[0]
  if (target) target[side] = int(target[side]) + Math.abs(diff)
  return lines
}
