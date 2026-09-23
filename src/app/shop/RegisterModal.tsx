"use client"

import { useState } from "react"
import type { ClientProfile } from "./useClient"

type Props = { open: boolean; onClose: () => void; onDone: (p: ClientProfile, alreadyRegistered: boolean) => void }

export default function RegisterModal({ open, onClose, onDone }: Props) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("") // pot de miel
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSending(true)
    try {
      const res = await fetch("/api/shop/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, website }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? "Inscription impossible"); return }
      onDone({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() }, !!d.alreadyRegistered)
      setFirstName(""); setLastName(""); setPhone("")
    } catch { setError("Erreur réseau, réessayez") } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[65] grid place-items-end bg-black/40 sm:place-items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Créer mon compte</h3>
            <p className="mt-0.5 text-sm text-slate-500">Inscrivez-vous pour commander plus vite et suivre vos offres de rentrée.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="Fermer">✕</button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">Prénom
            <input required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={60}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="Awa" />
          </label>
          <label className="text-sm font-medium text-slate-600">Nom
            <input required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={60}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="Diop" />
          </label>
          <label className="text-sm font-medium text-slate-600 sm:col-span-2">Numéro de téléphone
            <div className="mt-1 flex rounded-lg border border-slate-200 focus-within:border-indigo-400">
              <span className="grid place-items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">+221</span>
              <input required type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20}
                className="w-full rounded-r-lg px-3 py-2.5 text-sm outline-none" placeholder="77 123 45 67" />
            </div>
          </label>
          {/* Champ invisible anti-robots */}
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden name="website" />
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={sending}
          className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
          {sending ? "Inscription..." : "S'inscrire"}
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">Vos informations servent uniquement au suivi de vos commandes Schoolmatik.</p>
      </form>
    </div>
  )
}
