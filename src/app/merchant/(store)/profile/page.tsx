"use client"

import { useState } from "react"
import { Loader2, Check, Store as StoreIcon } from "lucide-react"
import { useMerchant, merchantFetch, fmtWhen, type MerchantStore } from "../MerchantContext"

export default function MerchantProfile() {
  const { store, setStore } = useMerchant()
  const [form, setForm] = useState({ phone: store.phone ?? "", address: store.address ?? "", image: store.image ?? "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      setStore(await merchantFetch<MerchantStore>("/api/merchant/me", { method: "PATCH", body: form }))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const readOnly = [
    { label: "Nom de la boutique", value: store.name },
    { label: "E-mail (identifiant de connexion)", value: store.email },
    { label: "Zone de service", value: store.serviceArea ?? "—" },
    { label: "Inscrite le", value: fmtWhen(store.createdAt) },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Profil de la boutique</h1>
        <p className="text-sm text-gray-500">Le nom, l&apos;e-mail et la zone sont gérés par l&apos;administrateur Schoolmatik.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
          {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <StoreIcon size={28} className="text-indigo-400" />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 flex-1 min-w-0">
          {readOnly.map((r) => (
            <div key={r.label} className="min-w-0">
              <div className="text-[11px] text-gray-400">{r.label}</div>
              <div className="text-sm text-gray-700 truncate">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Téléphone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Logo / photo (URL)</label>
            <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Adresse</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-medium flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
          </button>
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={14} /> Enregistré</span>}
        </div>
      </form>
    </div>
  )
}
