import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { AccountingError } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

type Params = { params: Promise<{ code: string }> }

/** { label?, isActive? } — un compte utilisé par les écritures automatiques reste actif. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const code = (await params).code
    const a = await prisma.accAccount.findUnique({ where: { code } })
    if (!a) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    const b = await req.json().catch(() => ({}))
    const data: { label?: string; isActive?: boolean } = {}
    if (typeof b.label === "string" && b.label.trim()) data.label = b.label.trim().slice(0, 120)
    if (typeof b.isActive === "boolean") {
      if (!b.isActive && a.isSystem) throw new AccountingError("Compte utilisé par les écritures automatiques : il reste actif")
      data.isActive = b.isActive
    }
    return NextResponse.json(await prisma.accAccount.update({ where: { code }, data }))
  } catch (e) { return accError(e) }
}

/** Suppression : seulement un compte jamais mouvementé et non système. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const code = (await params).code
    const a = await prisma.accAccount.findUnique({ where: { code } })
    if (!a) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    if (a.isSystem) throw new AccountingError("Compte utilisé par les écritures automatiques")
    if (await prisma.accLine.findFirst({ where: { account: code } })) throw new AccountingError("Compte mouvementé : désactivez-le au lieu de le supprimer")
    await prisma.accAccount.delete({ where: { code } })
    return NextResponse.json({ ok: true })
  } catch (e) { return accError(e) }
}
