"use client"

import { useCallback, useEffect, useState } from "react"
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, Loader2, X } from "lucide-react"
import { merchantFetch, fmtFcfa, fmtWhen } from "../MerchantContext"

interface Tx {
  id: string
  amount: number
  type: string
  method: string
  description: string | null
  receiptNo: string | null
  status: string
  createdAt: string
}
interface WalletData { walletMoney: number; pendingCashout: number; methods: string[]; transactions: Tx[] }

const STATUS: Record<string, { label: string; cls: string }> = {
  Pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  Completed: { label: "Effectué", cls: "bg-green-100 text-green-700" },
  Approved: { label: "Validé", cls: "bg-green-100 text-green-700" },
  Rejected: { label: "Refusé", cls: "bg-red-100 text-red-600" },
}

export default function MerchantWallet() {
  const [data, setData] = useState<WalletData | null>(null)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: "", method: "Wave", account: "" })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = useCallback(() => {
    merchantFetch<WalletData>("/api/merchant/wallet").then(setData).catch((e) => setError(e.message))
  }, [])
  useEffect(() => { load() }, [load])

  const requestCashout = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      await merchantFetch("/api/merchant/wallet", { method: "POST", body: form })
      setOpen(false)
      setForm({ amount: "", method: "Wave", account: "" })
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) return <div className="flex justify-center py-20"><Loader2 size={28} className="text-indigo-500 animate-spin" /></div>

  const available = Math.max(data.walletMoney - data.pendingCashout, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Portefeuille</h1>
        <p className="text-sm text-gray-500">Solde de la boutique et demandes de retrait</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white md:col-span-2">
          <div className="flex items-center gap-2 text-indigo-100 text-sm"><Wallet size={16} /> Solde actuel</div>
          <div className="text-3xl font-bold mt-2">{fmtFcfa(data.walletMoney)}</div>
          <div className="text-xs text-indigo-100 mt-1">Disponible au retrait : {fmtFcfa(available)}</div>
          <button onClick={() => { setOpen(true); setFormError("") }} disabled={available <= 0}
            className="mt-4 px-4 py-2 bg-white text-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold">
            Demander un retrait
          </button>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm"><Clock size={16} /> Retraits en attente</div>
          <div className="text-2xl font-bold text-gray-800 mt-2">{fmtFcfa(data.pendingCashout)}</div>
          <p className="text-xs text-gray-400 mt-1">Validés par l&apos;administrateur Schoolmatik</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Mouvements</h2></div>
        {data.transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Aucun mouvement pour le moment</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.transactions.map((t) => {
              const out = t.type === "Retrait" || t.amount < 0
              const st = STATUS[t.status] ?? { label: t.status, cls: "bg-gray-100 text-gray-600" }
              return (
                <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${out ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                    {out ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{t.type} · {t.method}</div>
                    <div className="text-xs text-gray-400 truncate">{fmtWhen(t.createdAt)}{t.description ? ` · ${t.description}` : ""}</div>
                  </div>
                  <div className={`text-sm font-semibold whitespace-nowrap ${out ? "text-red-600" : "text-green-600"}`}>
                    {out ? "−" : "+"}{fmtFcfa(Math.abs(t.amount))}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={requestCashout} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Demande de retrait</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Montant (max {fmtFcfa(available)})</label>
                <input type="number" min={1} max={available} step={1} required inputMode="numeric" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Recevoir par</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm bg-white">
                  {data.methods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{form.method === "Virement" ? "IBAN / RIB" : "Numéro de téléphone"}</label>
                <input required value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Envoyer la demande
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
