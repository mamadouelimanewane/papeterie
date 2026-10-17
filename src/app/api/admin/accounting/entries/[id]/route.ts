import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { AccountingError, createEntry } from "@/lib/accounting/ledger"
import { audit } from "@/lib/security/audit"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req)
  if (res) return res
  const entry = await prisma.accEntry.findUnique({ where: { id: (await params).id }, include: { lines: true } })
  return entry ? NextResponse.json(entry) : NextResponse.json({ error: "Écriture introuvable" }, { status: 404 })
}

/**
 * Suppression d'une écriture manuelle d'un exercice ouvert. Les écritures automatiques ne se suppriment pas :
 * POST { action: "reverse" } passe une contre-passation datée du jour (méthode exigée en comptabilité).
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const e = await prisma.accEntry.findUnique({ where: { id: (await params).id } })
    if (!e) return NextResponse.json({ error: "Écriture introuvable" }, { status: 404 })
    if (e.sourceType) throw new AccountingError("Écriture automatique : utilisez la contre-passation")
    const fy = await prisma.accFiscalYear.findUnique({ where: { year: e.fiscalYear } })
    if (fy?.status !== "Ouvert") throw new AccountingError("Exercice clôturé : suppression impossible, passez une écriture de correction")
    await prisma.accEntry.delete({ where: { id: e.id } })
    await audit(req, { email: (await accAuth(req)).who }, "accounting.delete", e.number, { libellé: e.label })
    return NextResponse.json({ ok: true })
  } catch (err) { return accError(err) }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    if (b.action !== "reverse") return NextResponse.json({ error: "Action invalide" }, { status: 400 })
    const e = await prisma.accEntry.findUnique({ where: { id: (await params).id }, include: { lines: true } })
    if (!e) return NextResponse.json({ error: "Écriture introuvable" }, { status: 404 })
    const today = new Date()
    const reversal = await createEntry({
      journal: e.journal, date: today, label: `Contre-passation de ${e.number} — ${e.label}`.slice(0, 200), reference: e.number,
      sourceType: "contre-passation", sourceId: e.id, createdBy: who,
      lines: e.lines.map((l) => ({ account: l.account, debit: l.credit, credit: l.debit, label: l.label, thirdParty: l.thirdParty, vatRate: l.vatRate })),
    })
    await audit(req, { email: who }, "accounting.reverse", e.number, { contrePassation: reversal.number })
    return NextResponse.json(reversal, { status: 201 })
  } catch (err) { return accError(err) }
}
