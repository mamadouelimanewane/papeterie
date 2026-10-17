"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import AccShell, { btn, btn2, card, dateFr, fcfaZ, input } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Asset = { id: string; label: string; account: string; amortAccount: string; acquisitionDate: string; cost: number; durationYears: number; status: string; amortized: number; netValue: number; annual: number }
const TYPES: { label: string; account: string; amort: string; years: number }[] = [
  { label: "Matériel informatique", account: "2442", amort: "28442", years: 3 },
  { label: "Matériel de bureau", account: "2441", amort: "28441", years: 5 },
  { label: "Mobilier", account: "2444", amort: "28444", years: 10 },
  { label: "Moto de livraison", account: "2456", amort: "2845", years: 3 },
  { label: "Véhicule", account: "2451", amort: "2845", years: 4 },
  { label: "Logiciel / site internet", account: "2131", amort: "2813", years: 3 },
]

export default function AssetsPage() {
  const [list, setList] = useState<Asset[] | null>(null)
  const [f, setF] = useState<{ label: string; type: number; acquisitionDate: string; cost: string; durationYears: string } | null>(null)
  const { toast, confirm } = useFeedback()
  const load = useCallback(() => { adminFetch<Asset[]>("/api/admin/accounting/assets").then(setList).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error")) }, [toast])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!f) return
    const t = TYPES[f.type]
    try {
      await adminFetch("/api/admin/accounting/assets", { method: "POST", body: { label: f.label, account: t.account, amortAccount: t.amort, acquisitionDate: f.acquisitionDate, cost: f.cost, durationYears: f.durationYears } })
      toast("Immobilisation ajoutée au registre"); setF(null); load()
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }
  const dispose = async (a: Asset) => {
    if (!(await confirm({ title: `Sortir « ${a.label} » du registre ?`, message: "Cession ou mise au rebut : plus aucune dotation ne sera calculée. Passez l'écriture de cession (comptes 81 / 82) dans Écritures.", confirmLabel: "Sortir" }))) return
    try { await adminFetch(`/api/admin/accounting/assets/${a.id}`, { method: "PATCH", body: { status: "Cédée" } }); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }
  const remove = async (a: Asset) => {
    if (!(await confirm({ title: `Supprimer la fiche « ${a.label} » ?`, confirmLabel: "Supprimer", danger: true }))) return
    try { await adminFetch(`/api/admin/accounting/assets/${a.id}`, { method: "DELETE" }); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }

  return (
    <AccShell title="Immobilisations" printTitle="Registre des immobilisations et tableau d'amortissement"
      actions={<button onClick={() => setF({ label: "", type: 0, acquisitionDate: new Date().toISOString().slice(0, 10), cost: "", durationYears: String(TYPES[0].years) })} className={`${btn} flex items-center gap-1.5`}><Plus size={14} /> Ajouter</button>}>
      <p className="acc-noprint mb-3 text-xs text-gray-500">Amortissement linéaire, prorata temporis la première année. Les dotations sont passées à la clôture de l&apos;exercice (débit 6813, crédit 28…). L&apos;achat lui-même se saisit dans Achats et charges.</p>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-3 py-2">Désignation</th><th className="px-2">Compte</th><th className="px-2">Acquisition</th><th className="px-2 text-right">Valeur d&apos;origine</th><th className="px-2 text-right">Durée</th><th className="px-2 text-right">Dotation annuelle</th><th className="px-2 text-right">Amort. cumulés</th><th className="px-2 text-right">VNC</th><th className="acc-noprint px-3"></th></tr>
          </thead>
          <tbody>
            {list?.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Aucune immobilisation.</td></tr>}
            {list?.map((a) => (
              <tr key={a.id} className="border-b border-gray-50">
                <td className="px-3 py-2 text-gray-700">{a.label}{a.status !== "En service" && <span className="ml-1 rounded bg-gray-100 px-1 text-[10px] text-gray-500">{a.status}</span>}</td>
                <td className="px-2 font-mono text-xs">{a.account}</td><td className="px-2 text-xs">{dateFr(a.acquisitionDate)}</td>
                <td className="px-2 text-right">{fcfaZ(a.cost)}</td><td className="px-2 text-right">{a.durationYears} an(s)</td><td className="px-2 text-right">{fcfaZ(a.annual)}</td>
                <td className="px-2 text-right">{fcfaZ(a.amortized)}</td><td className="px-2 text-right font-semibold">{fcfaZ(a.netValue)}</td>
                <td className="acc-noprint px-3 text-right">
                  {a.status === "En service" && <button onClick={() => dispose(a)} className="text-xs text-gray-500 hover:underline">Sortir</button>}
                  {a.amortized === 0 && <button onClick={() => remove(a)} className="ml-2 text-xs text-red-600 hover:underline">Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setF(null)}>
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-gray-800">Nouvelle immobilisation</div>
            <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Désignation (ex. Ordinateur portable caisse)" className={`${input} w-full`} />
            <select value={f.type} onChange={(e) => setF({ ...f, type: Number(e.target.value), durationYears: String(TYPES[Number(e.target.value)].years) })} className={`${input} w-full`}>
              {TYPES.map((t, i) => <option key={t.account + i} value={i}>{t.label} ({t.account} / {t.amort})</option>)}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-gray-500">Acquisition<input type="date" value={f.acquisitionDate} onChange={(e) => setF({ ...f, acquisitionDate: e.target.value })} className={`${input} mt-1 w-full`} /></label>
              <label className="text-xs text-gray-500">Valeur HT<input value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={`${input} mt-1 w-full`} /></label>
              <label className="text-xs text-gray-500">Durée (ans)<input value={f.durationYears} onChange={(e) => setF({ ...f, durationYears: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={`${input} mt-1 w-full`} /></label>
            </div>
            <div className="flex justify-end gap-2"><button onClick={() => setF(null)} className={btn2}>Annuler</button><button onClick={save} disabled={!f.label || !f.cost} className={btn}>Ajouter</button></div>
          </div>
        </div>
      )}
    </AccShell>
  )
}
