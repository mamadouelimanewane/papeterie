"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewSubAdminPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "Admin", password: "", confirm: "" })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    setMsg(null)
    if (!form.name || !form.email || !form.password) { setMsg({ ok: false, text: "Nom, email et mot de passe sont requis." }); return }
    if (form.password !== form.confirm) { setMsg({ ok: false, text: "Les mots de passe ne correspondent pas." }); return }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      })
      const d = await res.json()
      if (res.ok) {
        setMsg({ ok: true, text: "Compte créé avec succès." })
        setTimeout(() => router.push("/settings/sub-admin"), 800)
      } else setMsg({ ok: false, text: d.error ?? "Erreur" })
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Erreur réseau" })
    } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Retour</button>
        <h1 className="text-lg font-semibold text-gray-700">Ajouter un sous-admin</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
        {msg && <div className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</div>}
        <div className="space-y-4">
          {[
            { label: "Nom complet *", key: "name", type: "text", placeholder: "Prénom Nom" },
            { label: "Email *", key: "email", type: "email", placeholder: "email@schoolmatik.sn" },
            { label: "Téléphone", key: "phone", type: "tel", placeholder: "+221 77 000 00 00" },
            { label: "Mot de passe *", key: "password", type: "password", placeholder: "••••••••" },
            { label: "Confirmer le mot de passe *", key: "confirm", type: "password", placeholder: "••••••••" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Rôle *</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Operateur">Opérateur</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={submit} disabled={busy} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
              {busy ? "Création…" : "Créer l'admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
