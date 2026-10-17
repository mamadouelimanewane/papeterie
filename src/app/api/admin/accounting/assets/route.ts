import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { accAuth, accError } from "@/lib/accounting/api"
import { AccountingError } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/** Registre des immobilisations, avec amortissements cumulés et valeur nette comptable. */
export async function GET(req: NextRequest) {
  const { res } = await accAuth(req)
  if (res) return res
  try {
    const assets = await prisma.accFixedAsset.findMany({ orderBy: { acquisitionDate: "desc" } })
    const out = await Promise.all(assets.map(async (a) => {
      const s = await prisma.accLine.aggregate({ where: { account: a.amortAccount, entry: { sourceType: "amortissement", sourceId: { startsWith: `${a.id}:` } } }, _sum: { credit: true } })
      const amortized = s._sum.credit ?? 0
      return { ...a, amortized, netValue: a.cost - amortized, annual: Math.round(a.cost / a.durationYears) }
    }))
    return NextResponse.json(out)
  } catch (e) { return accError(e) }
}

/**
 * { label, account (2xxx), amortAccount (28xxx), acquisitionDate, cost, durationYears }
 * L'acquisition elle-même se saisit dans Achats & charges (compte 2xxx) ; ici on suit l'amortissement.
 */
export async function POST(req: NextRequest) {
  const { res } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const label = String(b.label ?? "").trim().slice(0, 120)
    const account = String(b.account ?? ""), amortAccount = String(b.amortAccount ?? "")
    const cost = Math.round(Number(b.cost)), duration = Number(b.durationYears)
    const date = typeof b.acquisitionDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.acquisitionDate) ? new Date(`${b.acquisitionDate}T00:00:00Z`) : null
    if (!label) throw new AccountingError("Désignation obligatoire")
    if (!/^2[1-5]\d*$/.test(account)) throw new AccountingError("Compte d'immobilisation invalide (21 à 25)")
    if (!/^28\d+$/.test(amortAccount)) throw new AccountingError("Compte d'amortissement invalide (28…)")
    if (!(await prisma.accAccount.findUnique({ where: { code: amortAccount } }))) throw new AccountingError(`Compte ${amortAccount} absent du plan comptable`)
    if (!date) throw new AccountingError("Date d'acquisition invalide")
    if (!Number.isFinite(cost) || cost <= 0) throw new AccountingError("Valeur d'origine invalide")
    if (!Number.isInteger(duration) || duration < 1 || duration > 50) throw new AccountingError("Durée d'amortissement invalide (1 à 50 ans)")
    return NextResponse.json(await prisma.accFixedAsset.create({ data: { label, account, amortAccount, cost, durationYears: duration, acquisitionDate: date } }), { status: 201 })
  } catch (e) { return accError(e) }
}
