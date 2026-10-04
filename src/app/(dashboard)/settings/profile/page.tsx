"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Eye, EyeOff, Save, KeyRound, ShieldCheck } from "lucide-react"
import { useAction, useFeedback } from "@/components/admin/Feedback"
import { adminFetch, fmtDate } from "@/lib/adminApi"

type Profile = { id: string; name: string; email: string; phone: string | null; role: string; editable: boolean; createdAt?: string }

const input = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-400"

function PasswordInput({ value, onChange, autoComplete, disabled }: { value: string; onChange: (v: string) => void; autoComplete: string; disabled?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} disabled={disabled} className={`${input} pr-10`} />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    </div>
  )
}

export default function ProfilePage() {
  const { update: refreshSession } = useSession()
  const { confirm } = useFeedback()
  const run = useAction()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    adminFetch<Profile>("/api/admin/profile")
      .then((p) => { setProfile(p); setForm({ name: p.name, email: p.email, phone: p.phone ?? "" }) })
      .catch((e) => setError(e.message))
  }, [])

  const dirty = !!profile && (form.name !== profile.name || form.email !== profile.email || form.phone !== (profile.phone ?? ""))
  const strength = pwd.newPassword.length >= 12 ? 3 : pwd.newPassword.length >= 8 ? 2 : pwd.newPassword ? 1 : 0

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSavingInfo(true)
    const r = await run(() => adminFetch<Profile & { emailChanged: boolean }>("/api/admin/profile", { method: "PUT", body: form }), "Profil mis à jour")
    setSavingInfo(false)
    if (!r) return
    setProfile((p) => (p ? { ...p, ...r } : p))
    await refreshSession?.({ name: r.name, email: r.email }).catch(() => {})
    if (r.emailChanged && await confirm({ title: "Adresse e-mail modifiée", message: "Reconnectez-vous avec votre nouvelle adresse pour que tout le back-office l'utilise.", confirmLabel: "Me reconnecter" })) {
      signOut({ callbackUrl: "/login" })
    }
  }

  async function savePwd(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.newPassword !== pwd.confirmPassword) { await run(async () => { throw new Error("Les deux nouveaux mots de passe ne correspondent pas") }); return }
    setSavingPwd(true)
    const r = await run(() => adminFetch("/api/admin/profile", { method: "PUT", body: { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword } }), "Mot de passe modifié")
    setSavingPwd(false)
    if (r) setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>
  const locked = profile ? !profile.editable : true

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {(profile?.name ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-700">👤 Mon profil</h1>
          {profile && <p className="flex items-center gap-1 text-xs text-gray-400"><ShieldCheck size={12} /> {profile.role}{profile.createdAt ? ` · compte créé le ${fmtDate(profile.createdAt)}` : ""}</p>}
        </div>
      </div>

      {profile && !profile.editable && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous êtes connecté avec le compte administrateur défini dans la configuration du serveur : il ne peut pas être modifié ici.
          Créez un compte nominatif dans <b>Utilisateurs &amp; rôles</b> pour disposer d&apos;un profil modifiable.
        </p>
      )}

      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${profile ? "" : "pointer-events-none animate-pulse opacity-60"}`}>
        <form onSubmit={saveInfo} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-gray-100 pb-2 font-semibold text-gray-700">Informations personnelles</h2>
          <div className="space-y-4">
            <div><label className="mb-1 block text-xs text-gray-500">Nom complet</label>
              <input required minLength={2} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={locked} className={input} /></div>
            <div><label className="mb-1 block text-xs text-gray-500">E-mail (identifiant de connexion)</label>
              <input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={locked} className={input} /></div>
            <div><label className="mb-1 block text-xs text-gray-500">Téléphone</label>
              <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+221 77 000 00 00" disabled={locked} className={input} /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={locked || !dirty || savingInfo} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                <Save size={14} /> {savingInfo ? "Enregistrement…" : "Enregistrer"}
              </button>
              {dirty && <button type="button" onClick={() => profile && setForm({ name: profile.name, email: profile.email, phone: profile.phone ?? "" })} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>}
            </div>
          </div>
        </form>

        <form onSubmit={savePwd} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-gray-100 pb-2 font-semibold text-gray-700">Changer le mot de passe</h2>
          <div className="space-y-4">
            <div><label className="mb-1 block text-xs text-gray-500">Mot de passe actuel</label>
              <PasswordInput value={pwd.currentPassword} onChange={(v) => setPwd({ ...pwd, currentPassword: v })} autoComplete="current-password" disabled={locked} /></div>
            <div><label className="mb-1 block text-xs text-gray-500">Nouveau mot de passe (8 caractères minimum)</label>
              <PasswordInput value={pwd.newPassword} onChange={(v) => setPwd({ ...pwd, newPassword: v })} autoComplete="new-password" disabled={locked} />
              {strength > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">{[1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded ${i <= strength ? ["", "bg-red-400", "bg-amber-400", "bg-green-500"][strength] : "bg-gray-200"}`} />)}</div>
                  <span className="text-[11px] text-gray-400">{["", "Trop court", "Correct", "Solide"][strength]}</span>
                </div>
              )}
            </div>
            <div><label className="mb-1 block text-xs text-gray-500">Confirmer le nouveau mot de passe</label>
              <PasswordInput value={pwd.confirmPassword} onChange={(v) => setPwd({ ...pwd, confirmPassword: v })} autoComplete="new-password" disabled={locked} />
              {pwd.confirmPassword && pwd.confirmPassword !== pwd.newPassword && <p className="mt-1 text-[11px] text-red-500">Les mots de passe ne correspondent pas</p>}
            </div>
            <button type="submit" disabled={locked || savingPwd || !pwd.currentPassword || pwd.newPassword.length < 8 || pwd.newPassword !== pwd.confirmPassword}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              <KeyRound size={14} /> {savingPwd ? "Mise à jour…" : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
