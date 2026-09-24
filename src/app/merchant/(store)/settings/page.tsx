"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Shield, Loader2, Check, LogOut } from "lucide-react"
import { useMerchant, merchantFetch, fmtWhen } from "../MerchantContext"

const MIN_PASSWORD_LENGTH = 8

export default function MerchantSettings() {
  const { store } = useMerchant()
  const [form, setForm] = useState({ current: "", next: "", confirm: "" })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDone(false)
    if (form.next.length < MIN_PASSWORD_LENGTH) { setError(`Au moins ${MIN_PASSWORD_LENGTH} caractères`); return }
    if (form.next !== form.confirm) { setError("Les deux mots de passe ne correspondent pas"); return }
    setSaving(true)
    try {
      await merchantFetch("/api/merchant/password", { method: "PATCH", body: { current: form.current, next: form.next } })
      setForm({ current: "", next: "", confirm: "" })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const input = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <input type="password" value={form[key]} autoComplete={autoComplete} required
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-sm text-gray-500">Sécurité du compte marchand · dernière connexion {fmtWhen(store.lastLoginAt)}</p>
      </div>

      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Shield size={16} /> Changer le mot de passe</h2>
        <input type="email" value={store.email} autoComplete="username" readOnly hidden />
        {input("current", "Mot de passe actuel", "current-password")}
        {input("next", `Nouveau mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`, "new-password")}
        {input("confirm", "Confirmer le nouveau mot de passe", "new-password")}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-medium flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Mettre à jour
          </button>
          {done && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={14} /> Mot de passe modifié</span>}
        </div>
        <p className="text-xs text-gray-400">Mot de passe oublié ? Demandez un nouveau lien d&apos;invitation à l&apos;administrateur.</p>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-800">Se déconnecter</div>
          <div className="text-xs text-gray-400">Fermer la session sur cet appareil</div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/merchant/login" })}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </div>
  )
}
