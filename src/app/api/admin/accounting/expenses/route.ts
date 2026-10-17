import { NextRequest, NextResponse } from "next/server"
import { accAuth, accError } from "@/lib/accounting/api"
import { ACC, treasuryFor } from "@/lib/accounting/chart"
import { AccountingError, balanceLines, createEntry } from "@/lib/accounting/ledger"

export const runtime = "nodejs"

/**
 * Achat ou charge (facture fournisseur) en une saisie :
 * { date, supplier, invoiceNo?, account (6xxx ou 2xxx), label, amountTtc, vatRate, paidWith?: "Espèces"|"Wave"|"Virement"… }
 *  AC : charge HT + TVA récupérable / 401 Fournisseur (TTC)
 *  règlement (si payé) : 401 Fournisseur / trésorerie
 */
export async function POST(req: NextRequest) {
  const { res, who } = await accAuth(req, true)
  if (res) return res
  try {
    const b = await req.json().catch(() => ({}))
    const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? new Date(`${b.date}T12:00:00Z`) : null
    const ttc = Math.round(Number(b.amountTtc))
    const rate = Number(b.vatRate ?? 0)
    const account = String(b.account ?? "")
    const supplier = String(b.supplier ?? "").trim().slice(0, 120)
    if (!date) throw new AccountingError("Date invalide")
    if (!supplier) throw new AccountingError("Fournisseur obligatoire")
    if (!/^[2-6]\d{2,}$/.test(account)) throw new AccountingError("Compte de charge ou d'immobilisation invalide (classe 2 à 6)")
    if (!Number.isFinite(ttc) || ttc <= 0) throw new AccountingError("Montant TTC invalide")
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new AccountingError("Taux de TVA invalide")
    const ht = Math.round((ttc * 100) / (100 + rate))
    const vat = ttc - ht
    // TVA récupérable : sur immobilisations (4451), achats de marchandises (4452), services et autres charges (4454)
    const vatAccount = account.startsWith("2") ? "4451" : account.startsWith("60") ? ACC.vatDeductibleGoods : ACC.vatDeductibleServices
    const label = String(b.label ?? "").trim() || `Facture ${supplier}`
    const reference = b.invoiceNo ? String(b.invoiceNo).slice(0, 80) : null
    const purchase = await createEntry({
      journal: "AC", date, label: `${label} — ${supplier}`, reference, createdBy: who,
      lines: balanceLines([
        { account, debit: ht, label, vatRate: rate },
        ...(vat ? [{ account: vatAccount, debit: vat, label: `TVA ${rate} % récupérable`, vatRate: rate }] : []),
        { account: ACC.supplier, credit: ttc, thirdParty: supplier, label },
      ]),
    })
    let payment = null
    if (b.paidWith) {
      const t = treasuryFor(String(b.paidWith))
      payment = await createEntry({
        journal: t.journal, date, label: `Règlement ${supplier}${reference ? ` — ${reference}` : ""}`, reference, createdBy: who,
        lines: [{ account: ACC.supplier, debit: ttc, thirdParty: supplier }, { account: t.account, credit: ttc }],
      })
    }
    return NextResponse.json({ purchase, payment }, { status: 201 })
  } catch (e) { return accError(e) }
}
