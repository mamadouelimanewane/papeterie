"use client"

import { useCallback, useEffect, useState } from "react"
import AccShell, { btn, card, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Vat = { byRate: { rate: number | null; base: number; vat: number }[]; collected: number; deductible: number; creditCarried: number; net: number; toPay: number; creditToCarry: number; settled: boolean; company: Record<string, string> }
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

export default function VatPage() {
  const [year, setYear] = useYear()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [v, setV] = useState<Vat | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast, confirm } = useFeedback()
  const period = () => {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: `${year}-${String(month).padStart(2, "0")}-${last}` }
  }
  const load = useCallback(() => {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const p = { from: `${year}-${String(month).padStart(2, "0")}-01`, to: `${year}-${String(month).padStart(2, "0")}-${last}` }
    adminFetch<Vat>(`/api/admin/accounting/reports?type=vat&year=${year}&from=${p.from}&to=${p.to}`).then(setV).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [year, month, toast])
  useEffect(() => { load() }, [load])

  const settle = async () => {
    if (!(await confirm({ title: `Liquider la TVA de ${MONTHS[month - 1]} ${year} ?`, message: "Les comptes de TVA collectée et récupérable du mois sont soldés vers « État, TVA due » (4441) ou « crédit de TVA à reporter » (4449). Le paiement à la DGID se saisit ensuite dans Écritures (4441 / banque).", confirmLabel: "Liquider" }))) return
    setBusy(true)
    try { await adminFetch("/api/admin/accounting/vat", { method: "POST", body: { year, month } }); toast("TVA liquidée"); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }

  return (
    <AccShell title="Déclaration de TVA" year={year} onYear={setYear} company={v?.company} printTitle={`Déclaration de TVA — ${MONTHS[month - 1]} ${year}`}>
      <div className="acc-noprint mb-4 flex flex-wrap items-center gap-2">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={input}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        <span className="text-xs text-gray-400">Période du {period().from.split("-").reverse().join("/")} au {period().to.split("-").reverse().join("/")} · déclaration mensuelle à déposer auprès de la DGID.</span>
      </div>
      {!v ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`${card} overflow-hidden`}>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">Chiffre d&apos;affaires et TVA collectée</div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-400"><tr><th className="px-4 py-1">Taux</th><th className="px-2 text-right">Base HT</th><th className="px-4 text-right">TVA</th></tr></thead>
              <tbody>
                {v.byRate.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Aucune vente sur la période.</td></tr>}
                {v.byRate.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50"><td className="px-4 py-1.5">{r.rate === null ? "Non ventilé" : r.rate === 0 ? "Exonéré (0 %)" : `${r.rate} %`}</td><td className="px-2 text-right">{fcfaZ(r.base)}</td><td className="px-4 text-right">{fcfaZ(r.vat)}</td></tr>
                ))}
                <tr className="border-t-2 border-gray-200 font-bold"><td className="px-4 py-2">Total</td><td className="px-2 text-right">{fcfaZ(v.byRate.reduce((s, r) => s + r.base, 0))}</td><td className="px-4 text-right">{fcfaZ(v.collected)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className={`${card} space-y-2 p-4 text-sm`}>
            <div className="flex justify-between"><span>TVA collectée</span><b>{fcfaZ(v.collected)}</b></div>
            <div className="flex justify-between"><span>TVA récupérable (achats, services, immobilisations)</span><b>− {fcfaZ(v.deductible)}</b></div>
            <div className="flex justify-between"><span>Crédit de TVA reporté des mois précédents</span><b>− {fcfaZ(v.creditCarried)}</b></div>
            <div className={`flex justify-between rounded-lg px-3 py-2 text-base ${v.net > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              <span className="font-semibold">{v.net > 0 ? "TVA à payer" : "Crédit de TVA à reporter"}</span><b>{fcfaZ(Math.abs(v.net))} FCFA</b>
            </div>
            <div className="acc-noprint pt-2">
              {v.settled ? <p className="text-xs font-semibold text-emerald-700">✓ TVA de ce mois déjà liquidée.</p>
                : <button onClick={settle} disabled={busy || (v.collected === 0 && v.deductible === 0)} className={btn}>Liquider la TVA du mois</button>}
            </div>
          </div>
        </div>
      )}
      <p className="mt-4 text-[11px] text-gray-400">Taux appliqués aux ventes : celui de chaque produit, sinon de sa catégorie, sinon le taux par défaut (Réglages). Le taux est figé au moment de la commande.</p>
    </AccShell>
  )
}
