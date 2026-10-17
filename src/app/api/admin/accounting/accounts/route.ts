import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { AccountingError, ensureChart } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/** Plan comptable (avec le nombre de lignes passées sur chaque compte). */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    await ensureChart()
    const [accounts, used] = await Promise.all([
      prisma.accAccount.findMany({ orderBy: { code: "asc" } }),
      prisma.accLine.groupBy({ by: ["account"], _count: { _all: true } }),
    ])
    const n = new Map(used.map((u) => [u.account, u._count._all]))
    return NextResponse.json(accounts.map((a) => ({ ...a, lines: n.get(a.code) ?? 0 })))
  } catch (e) { return accError(e) }
}

/** Création d'un compte : { code (chiffres, classe 1 à 8), label }. Un sous-compte doit commencer par un compte existant. */
export async function POST(req: NextRequest) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const code = String(b.code ?? "").trim(), label = String(b.label ?? "").trim().slice(0, 120)
    if (!/^[1-8]\d{1,7}$/.test(code)) throw new AccountingError("Numéro de compte invalide (2 à 8 chiffres, classe 1 à 8)")
    if (!label) throw new AccountingError("Intitulé obligatoire")
    if (await prisma.accAccount.findUnique({ where: { code } })) throw new AccountingError("Ce compte existe déjà")
    const parents = Array.from({ length: code.length - 2 }, (_, i) => code.slice(0, i + 2))
    if (parents.length && !(await prisma.accAccount.findFirst({ where: { code: { in: parents } } }))) {
      throw new AccountingError("Rattachez le compte à une racine du plan SYSCOHADA (ex. 6056… sous 605)")
    }
    return NextResponse.json(await prisma.accAccount.create({ data: { code, label } }), { status: 201 })
  } catch (e) { return accError(e) }
}
