import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { accAuth, accError, dateParam, yearParam } from "@/lib/accounting/api"
import { createEntry, type LineInput } from "@/lib/accounting/ledger"
import { audit } from "@/lib/security/audit"

export const runtime = "nodejs"

/** Journal des écritures : filtres exercice, journal, période, compte, recherche ; 50 par page. */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    const q = req.nextUrl.searchParams
    const year = yearParam(req)
    const page = Math.max(1, Number(q.get("page")) || 1)
    const where: Prisma.AccEntryWhereInput = { fiscalYear: year }
    if (q.get("journal")) where.journal = q.get("journal")!
    const from = dateParam(req, "from"), to = dateParam(req, "to", true)
    if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    if (q.get("account")) where.lines = { some: { account: { startsWith: q.get("account")! } } }
    if (q.get("q")) {
      const s = q.get("q")!
      where.OR = [{ label: { contains: s, mode: "insensitive" } }, { reference: { contains: s, mode: "insensitive" } }, { number: { contains: s, mode: "insensitive" } }]
    }
    if (q.get("origin") === "manual") where.sourceType = null
    if (q.get("origin") === "auto") where.sourceType = { not: null }
    const [entries, total] = await Promise.all([
      prisma.accEntry.findMany({ where, include: { lines: true }, orderBy: [{ date: "desc" }, { number: "desc" }], skip: (page - 1) * 50, take: 50 }),
      prisma.accEntry.count({ where }),
    ])
    return NextResponse.json({ entries, total, page, pages: Math.max(1, Math.ceil(total / 50)) })
  } catch (e) { return accError(e) }
}

/** Saisie manuelle : { journal, date (AAAA-MM-JJ), label, reference?, lines: [{ account, debit, credit, label?, thirdParty? }] } */
export async function POST(req: NextRequest) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? new Date(`${b.date}T12:00:00Z`) : new Date(NaN)
    const lines: LineInput[] = Array.isArray(b.lines) ? b.lines.slice(0, 100).map((l: Record<string, unknown>) => ({
      account: String(l.account ?? ""), debit: Number(l.debit) || 0, credit: Number(l.credit) || 0,
      label: l.label ? String(l.label) : null, thirdParty: l.thirdParty ? String(l.thirdParty) : null,
      vatRate: l.vatRate === undefined || l.vatRate === null || l.vatRate === "" ? null : Number(l.vatRate),
    })) : []
    const entry = await createEntry({ journal: String(b.journal ?? ""), date, label: String(b.label ?? ""), reference: b.reference ? String(b.reference) : null, lines, createdBy: who })
    await audit(req, { email: who }, "accounting.entry", entry.number, { journal: entry.journal, libellé: entry.label })
    return NextResponse.json(entry, { status: 201 })
  } catch (e) { return accError(e) }
}
