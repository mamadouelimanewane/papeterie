"use client"

import { useCallback, useEffect, useState } from "react"
import AccShell, { btn, card, dateFr, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

/** Natures courantes pour une librairie (compte SYSCOHADA proposé ; tout autre compte reste possible). */
const NATURES: [string, string][] = [
  ["6011", "Achat de marchandises (fournitures, livres)"],
  ["6055", "Fournitures de bureau"],
  ["6052", "Électricité"], ["6051", "Eau"],
  ["6222", "Loyer"],
  ["6281", "Téléphone"], ["6283", "Internet"],
  ["627", "Publicité, impression de flyers"],
  ["6181", "Déplacements"],
  ["624", "Entretien et réparations"],
  ["625", "Assurance"],
  ["6324", "Honoraires (comptable, avocat)"],
  ["6343", "Logiciels et abonnements"],
  ["6318", "Frais bancaires et de paiement en ligne"],
  ["6412", "Patente / Contribution économique locale"],
  ["661", "Salaires"],
  ["6641", "Charges sociales (IPRES, CSS)"],
  ["2442", "Achat de matériel informatique (immobilisation)"],
  ["2444", "Achat de mobilier (immobilisation)"],
  ["2456", "Achat d'une moto de livraison (immobilisation)"],
]

type Entry = { id: string; number: string; date: string; label: string; reference: string | null; lines: { account: string; debit: number; credit: number }[] }
const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ date: today(), supplier: "", invoiceNo: "", account: "6011", label: "", amountTtc: "", vatRate: "18", paidWith: "Wave" })

export default function ExpensesPage() {
  const [year, setYear] = useYear()
  const [f, setF] = useState(blank())
  const [busy, setBusy] = useState(false)
  const [list, setList] = useState<Entry[]>([])
  const { toast } = useFeedback()
  const load = useCallback(() => {
    adminFetch<{ entries: Entry[] }>(`/api/admin/accounting/entries?year=${year}&journal=AC`).then((r) => setList(r.entries)).catch(() => {})
  }, [year])
  useEffect(() => { load() }, [load])

  const ttc = Number(f.amountTtc) || 0, rate = Number(f.vatRate) || 0
  const ht = Math.round((ttc * 100) / (100 + rate))

  const submit = async () => {
    setBusy(true)
    try {
      await adminFetch("/api/admin/accounting/expenses", { method: "POST", body: { ...f, paidWith: f.paidWith || null } })
      toast(f.paidWith ? "Facture et règlement enregistrés" : "Facture enregistrée (à payer)")
      setF({ ...blank(), date: f.date, paidWith: f.paidWith }); load()
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }

  return (
    <AccShell title="Achats et charges" year={year} onYear={setYear}>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className={`${card} space-y-3 p-5 lg:col-span-2`}>
          <div className="text-sm font-semibold text-gray-700">Nouvelle facture fournisseur</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={`${input} mt-1 w-full`} /></label>
            <label className="text-xs text-gray-500">N° de facture<input value={f.invoiceNo} onChange={(e) => setF({ ...f, invoiceNo: e.target.value })} className={`${input} mt-1 w-full`} /></label>
          </div>
          <label className="block text-xs text-gray-500">Fournisseur *<input value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} placeholder="Ex. Librairie Clairafrique, Senelec…" className={`${input} mt-1 w-full`} /></label>
          <label className="block text-xs text-gray-500">Nature
            <select value={NATURES.some(([c]) => c === f.account) ? f.account : ""} onChange={(e) => setF({ ...f, account: e.target.value || f.account })} className={`${input} mt-1 w-full`}>
              {NATURES.map(([c, l]) => <option key={c} value={c}>{l} — {c}</option>)}
              <option value="">Autre compte…</option>
            </select>
          </label>
          {!NATURES.some(([c]) => c === f.account) && <input value={f.account} onChange={(e) => setF({ ...f, account: e.target.value.replace(/\D/g, "") })} placeholder="Compte (classe 2 à 6)" className={`${input} w-full`} />}
          <label className="block text-xs text-gray-500">Libellé<input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Facultatif" className={`${input} mt-1 w-full`} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">Montant TTC (FCFA) *<input value={f.amountTtc} onChange={(e) => setF({ ...f, amountTtc: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={`${input} mt-1 w-full text-right`} /></label>
            <label className="text-xs text-gray-500">TVA récupérable
              <select value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: e.target.value })} className={`${input} mt-1 w-full`}>
                <option value="18">18 %</option><option value="10">10 %</option><option value="0">Sans TVA</option>
              </select>
            </label>
          </div>
          {ttc > 0 && <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">HT {fcfaZ(ht)} · TVA {fcfaZ(ttc - ht)} · TTC {fcfaZ(ttc)} FCFA</div>}
          <label className="block text-xs text-gray-500">Règlement
            <select value={f.paidWith} onChange={(e) => setF({ ...f, paidWith: e.target.value })} className={`${input} mt-1 w-full`}>
              <option value="Wave">Payée par Wave / Orange Money</option><option value="Espèces">Payée en espèces (caisse)</option><option value="Virement">Payée par banque (virement, chèque)</option><option value="">Pas encore payée (dette fournisseur)</option>
            </select>
          </label>
          <button onClick={submit} disabled={busy || !f.supplier || !ttc} className={`${btn} w-full`}>Enregistrer</button>
          <p className="text-[11px] text-gray-400">Écriture au journal des achats : charge HT et TVA récupérable au débit, fournisseur (4011) au crédit ; puis règlement au journal de trésorerie. Pour une immobilisation, ajoutez-la ensuite au registre (Immobilisations) pour son amortissement.</p>
        </div>

        <div className={`${card} lg:col-span-3`}>
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Factures fournisseurs de l&apos;exercice {year}</div>
          <table className="w-full text-sm">
            <tbody>
              {list.length === 0 && <tr><td className="px-4 py-8 text-center text-gray-400">Aucune facture saisie.</td></tr>}
              {list.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500">{dateFr(e.date)}</td>
                  <td className="px-2 py-2 text-gray-700">{e.label}<div className="text-[11px] text-gray-400">{e.number}{e.reference ? ` · ${e.reference}` : ""} · compte {e.lines.find((l) => l.debit && !l.account.startsWith("445"))?.account}</div></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-700">{fcfaZ(e.lines.reduce((s, l) => s + l.credit, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AccShell>
  )
}
