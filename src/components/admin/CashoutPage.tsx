"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, X, Plus, Download, RefreshCw } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import FormModal from "./FormModal"
import { useFeedback, useAction } from "./Feedback"
import { loadAccounts } from "@/hooks/useAdminData"
import { adminFetch, exportCsv, fmtDate, fmtMoney } from "@/lib/adminApi"

type Req = { id: string; name: string; phone: string; balance: number; amount: number; method: string; account: string; status: string; date: string }

/** Demandes de retrait des livreurs ou des boutiques : saisie, approbation (débit du portefeuille), rejet. */
export default function CashoutPage({ party }: { party: "driver" | "store" }) {
  const [rows, setRows] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState("Pending")
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([])
  const { confirm } = useFeedback()
  const run = useAction()
  const who = party === "driver" ? "Livreur" : "Boutique"

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setRows(await adminFetch<Req[]>(`/api/admin/wallet/cashout?party=${party}`)) }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") } finally { setLoading(false) }
  }, [party])
  useEffect(() => { load() }, [load])

  const act = async (r: Req, action: "approve" | "reject") => {
    const ok = await confirm(action === "approve"
      ? { title: `Approuver le retrait de ${fmtMoney(r.amount)} ?`, message: `Le portefeuille de ${r.name} sera débité (solde actuel : ${fmtMoney(r.balance)}). Effectuez le versement sur ${r.method} ${r.account}.`, confirmLabel: "Approuver" }
      : { title: "Rejeter cette demande ?", confirmLabel: "Rejeter", danger: true })
    if (!ok) return
    if (await run(() => adminFetch(`/api/admin/wallet/cashout/${r.id}`, { method: "PATCH", body: { action } }), action === "approve" ? "Retrait approuvé, portefeuille débité" : "Demande rejetée")) load()
  }

  const shown = rows.filter((r) => tab === "all" || r.status === tab)
  const count = (s: string) => rows.filter((r) => r.status === s).length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700"><span>💸</span> Demandes de retrait — {party === "driver" ? "Livreurs" : "Boutiques"}</h1>
        <div className="flex gap-2">
          <button onClick={load} title="Actualiser" className="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          <button disabled={!shown.length} onClick={() => exportCsv(`retraits-${party === "driver" ? "livreurs" : "boutiques"}`, [
            { key: "name", label: who }, { key: "amount", label: "Montant" }, { key: "method", label: "Méthode" }, { key: "account", label: "Compte" }, { key: "date", label: "Date" }, { key: "status", label: "Statut" },
          ], shown)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"><Download size={14} /> Exporter</button>
          <button onClick={async () => { setAccounts((await run(() => loadAccounts(party))) ?? []); setOpen(true) }}
            className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"><Plus size={14} /> Nouvelle demande</button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[["Pending", "En attente", "bg-yellow-500"], ["Completed", "Approuvées", "bg-green-500"], ["Rejected", "Rejetées", "bg-red-500"]].map(([k, l, c]) => (
          <button key={k} onClick={() => setTab(tab === k ? "all" : k)}
            className={`flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition ${tab === k ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100"}`}>
            <div className={`h-10 w-3 rounded-full ${c}`} />
            <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-800">{count(k)}</p></div>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>{["N°", who, "Montant (FCFA)", "Solde dispo.", "Méthode", "Compte", "Date demande", "Statut", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {error ? <tr><td colSpan={9} className="py-10 text-center text-sm text-red-500">{error}</td></tr>
              : !shown.length ? <tr><td colSpan={9} className="py-10 text-center text-sm text-gray-400">{loading ? "Chargement…" : "Aucune demande"}</td></tr>
              : shown.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.name}</div><div className="text-xs text-gray-500">{r.phone}</div></td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.amount.toLocaleString("fr-FR")}</td>
                  <td className={`px-4 py-3 text-xs ${r.balance < r.amount && r.status === "Pending" ? "font-semibold text-red-600" : "text-gray-500"}`}>{r.balance.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3 text-gray-600">{r.method}</td>
                  <td className="px-4 py-3 text-gray-600">{r.account || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === "Pending" ? (
                      <div className="flex gap-1">
                        <button onClick={() => act(r, "approve")} className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600" title="Approuver"><Check size={12} /></button>
                        <button onClick={() => act(r, "reject")} className="rounded bg-red-500 p-1.5 text-white hover:bg-red-600" title="Rejeter"><X size={12} /></button>
                      </div>
                    ) : <span className="text-xs text-gray-400">Traitée</span>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <FormModal
        open={open} title="Nouvelle demande de retrait" onClose={() => setOpen(false)}
        initial={{ method: "Wave" }}
        fields={[
          { key: "id", label: who, type: "select", options: accounts, required: true, full: true },
          { key: "amount", label: "Montant (FCFA)", type: "number", min: 1, required: true },
          { key: "method", label: "Méthode", type: "select", options: ["Wave", "Orange Money", "Virement", "Espèces"], required: true },
          { key: "account", label: "Numéro / compte de versement", placeholder: "77 000 00 00", full: true },
        ]}
        onSubmit={async (v) => {
          if (await run(() => adminFetch("/api/admin/wallet/cashout", { method: "POST", body: { ...v, party } }), "Demande enregistrée")) { setOpen(false); setTab("Pending"); load() }
        }}
      />
    </div>
  )
}
