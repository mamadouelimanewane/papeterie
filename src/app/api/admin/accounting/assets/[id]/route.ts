import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { AccountingError } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/** { status: "Cédée", disposedAt } : sortie de l'immobilisation (plus d'amortissement ensuite). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const id = (await params).id
    if (b.status === "Cédée") {
      const d = typeof b.disposedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.disposedAt) ? new Date(`${b.disposedAt}T00:00:00Z`) : new Date()
      return NextResponse.json(await prisma.accFixedAsset.update({ where: { id }, data: { status: "Cédée", disposedAt: d } }))
    }
    if (b.status === "En service") return NextResponse.json(await prisma.accFixedAsset.update({ where: { id }, data: { status: "En service", disposedAt: null } }))
    throw new AccountingError("Action invalide")
  } catch (e) { return accError(e) }
}

/** Suppression d'une fiche jamais amortie (erreur de saisie). */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const id = (await params).id
    if (await prisma.accEntry.findFirst({ where: { sourceType: "amortissement", sourceId: { startsWith: `${id}:` } } })) {
      throw new AccountingError("Immobilisation déjà amortie : déclarez plutôt sa cession")
    }
    await prisma.accFixedAsset.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { return accError(e) }
}
