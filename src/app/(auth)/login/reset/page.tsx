"use client"

import { useState } from "react"
import Link from "next/link"

/** Choix d'un nouveau mot de passe administrateur depuis le lien reçu par e-mail. */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 10) return setError("Au moins 10 caractères.")
    if (password !== confirm) return setError("Les deux mots de passe ne sont pas identiques.")
    const token = new URLSearchParams(window.location.search).get("token") ?? ""
    if (!token) return setError("Lien incomplet : ouvrez le lien reçu par e-mail.")
    setLoading(true)
    const r = await fetch("/api/admin-reset/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) })
    const d = await r.json().catch(() => ({}))
    setLoading(false)
    if (r.ok) setDone(true)
    else setError(d.error ?? "Erreur, réessayez.")
  }

  const input = "w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-base sm:text-sm text-gray-900 bg-gray-50"
  return (
    <div className="min-h-screen flex items-center justify-center bg-sun-400 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <h2 className="mb-1 text-center text-xl font-extrabold text-brand-700">Nouveau mot de passe</h2>
        <p className="mb-5 text-center text-xs text-gray-500">Espace Administration · Schoolmatik Librairie</p>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Mot de passe modifié. Vous pouvez vous connecter.</p>
            <Link href="/login" className="block w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700">Se connecter</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-500 p-3 text-sm text-white">{error}</div>}
            <input type="password" placeholder="Nouveau mot de passe (10 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={input} required />
            <input type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={input} required />
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <Link href="/login" className="block text-center text-xs text-gray-500 hover:text-brand-700">Retour à la connexion</Link>
          </form>
        )}
      </div>
    </div>
  )
}
