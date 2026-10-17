"use client"

import { useCallback, useEffect, useState } from "react"
import { Key, LogOut, Pencil, Plus, ShieldOff, Trash2 } from "lucide-react"
import Link from "next/link"
import SecurityTabs from "@/components/admin/SecurityTabs"
import { adminFetch, fmtDate } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Admin = { id: string; name: string; email: string; phone: string | null; role: string; status: string; createdAt: string; lastLoginAt: string | null; twoFactorEnabled: boolean; me: boolean }
type Role = { name: string; status: string }

export default function SubAdminPage() {
  const [admins, setAdmins] = useState<Admin[] | null>(null)
  const [roles, setRoles] = useState<string[]>(["Super Admin"])
  const [edit, setEdit] = useState<Admin | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const { toast, confirm } = useFeedback()

  const load = useCallback(() => {
    adminFetch<Admin[]>("/api/admin/users").then(setAdmins).catch((e) => { setErr(e instanceof Error ? e.message : "Erreur"); setAdmins([]) })
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { adminFetch<Role[]>("/api/admin/roles").then((d) => setRoles(["Super Admin", ...d.filter((r) => r.status !== "Inactive").map((r) => r.name)])).catch(() => {}) }, [])

  const patch = async (a: Admin, body: Record<string, unknown>, ok: string) => {
    try { await adminFetch(`/api/admin/users/${a.id}`, { method: "PATCH", body }); toast(ok); load(); return true } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error"); return false }
  }
  const changeRole = async (a: Admin, role: string) => {
    if (role === a.role) return
    if (await confirm({ title: `Rôle de ${a.name} : ${role} ?`, message: "Ses droits changent immédiatement et sa session est rouverte.", confirmLabel: "Changer" })) patch(a, { role }, `${a.name} : rôle ${role}`)
    else load()
  }
  const toggleStatus = async (a: Admin) => {
    const off = a.status === "Active"
    if (off && !(await confirm({ title: `Désactiver le compte de ${a.name} ?`, message: "Il est déconnecté immédiatement et ne peut plus se connecter (le compte reste dans le journal d'audit).", confirmLabel: "Désactiver", danger: true }))) return
    patch(a, { status: off ? "Inactive" : "Active" }, off ? `${a.name} désactivé et déconnecté` : `${a.name} réactivé`)
  }
  const resetPassword = async (a: Admin) => {
    const p = window.prompt(`Nouveau mot de passe pour ${a.name} (10 caractères minimum, lettres et chiffres) :`)
    if (p) patch(a, { password: p }, `Mot de passe de ${a.name} réinitialisé, sessions fermées`)
  }
  const revoke = async (a: Admin) => {
    if (await confirm({ title: `Déconnecter ${a.name} partout ?`, message: "Toutes ses sessions ouvertes (ordinateurs, téléphones) sont fermées ; il devra se reconnecter.", confirmLabel: "Déconnecter" })) patch(a, { revokeSessions: true }, `${a.name} déconnecté de toutes ses sessions`)
  }
  const reset2fa = async (a: Admin) => {
    if (await confirm({ title: `Réinitialiser la double authentification de ${a.name} ?`, message: "À utiliser s'il a perdu son téléphone : il pourra se connecter avec son seul mot de passe puis reconfigurer l'application.", confirmLabel: "Réinitialiser", danger: true })) patch(a, { reset2fa: true }, `Double authentification de ${a.name} réinitialisée`)
  }
  const remove = async (a: Admin) => {
    if (!(await confirm({ title: `Supprimer le compte de ${a.name} ?`, message: `${a.email} — préférez la désactivation pour garder l'historique lisible.`, confirmLabel: "Supprimer", danger: true }))) return
    try { await adminFetch(`/api/admin/users/${a.id}`, { method: "DELETE" }); toast(`${a.name} supprimé`); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }
  const saveEdit = async () => {
    if (!edit) return
    if (await patch(edit, { name: edit.name, email: edit.email, phone: edit.phone ?? "" }, "Compte modifié")) setEdit(null)
  }

  const icon = "rounded p-1.5 text-white disabled:opacity-30"
  return (
    <div>
      <SecurityTabs title="Administrateurs" actions={<Link href="/settings/sub-admin/new" className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Plus size={14} /> Ajouter un administrateur</Link>} />
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-2">Rôle</th><th className="px-2">Statut</th><th className="px-2">2FA</th><th className="px-2">Dernière connexion</th><th className="px-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins === null && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Chargement…</td></tr>}
            {admins?.length === 0 && !err && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucun compte.</td></tr>}
            {admins?.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800" data-no-i18n>{a.name}{a.me && <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-600">vous</span>}</div>
                  <div className="text-xs text-gray-500" data-no-i18n>{a.email}{a.phone ? ` · ${a.phone}` : ""}</div>
                </td>
                <td className="px-2">
                  <select value={roles.includes(a.role) ? a.role : ""} disabled={a.me} onChange={(e) => changeRole(a, e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50">
                    {!roles.includes(a.role) && <option value="">{a.role} (rôle supprimé)</option>}
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-2"><button disabled={a.me} onClick={() => toggleStatus(a)} className={`rounded-full px-2 py-0.5 text-xs font-medium disabled:cursor-default ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{a.status === "Active" ? "Actif" : "Désactivé"}</button></td>
                <td className="px-2 text-xs">{a.twoFactorEnabled ? <span className="text-emerald-600">✓ activée</span> : <span className="text-amber-600">non</span>}</td>
                <td className="whitespace-nowrap px-2 text-xs text-gray-500">{a.lastLoginAt ? fmtDate(a.lastLoginAt) : "jamais"}</td>
                <td className="px-4">
                  <div className="flex gap-1">
                    <button onClick={() => setEdit({ ...a })} className={`${icon} bg-blue-500 hover:bg-blue-600`} title="Modifier nom, e-mail, téléphone"><Pencil size={12} /></button>
                    <button onClick={() => resetPassword(a)} className={`${icon} bg-orange-500 hover:bg-orange-600`} title="Réinitialiser le mot de passe"><Key size={12} /></button>
                    <button onClick={() => revoke(a)} className={`${icon} bg-gray-600 hover:bg-gray-700`} title="Déconnecter de toutes les sessions"><LogOut size={12} /></button>
                    <button onClick={() => reset2fa(a)} disabled={!a.twoFactorEnabled} className={`${icon} bg-purple-500 hover:bg-purple-600`} title="Réinitialiser la double authentification (téléphone perdu)"><ShieldOff size={12} /></button>
                    <button onClick={() => remove(a)} disabled={a.me} className={`${icon} bg-red-500 hover:bg-red-600`} title="Supprimer"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Changement de rôle, désactivation ou nouveau mot de passe : effet immédiat, les sessions ouvertes du compte sont fermées. Vous ne pouvez ni changer votre propre rôle, ni vous désactiver, et il reste toujours au moins un super-administrateur actif.</p>

      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-gray-800">Modifier le compte</div>
            {(["name", "email", "phone"] as const).map((k) => (
              <label key={k} className="block text-xs text-gray-500">{{ name: "Nom", email: "E-mail (sert à la connexion)", phone: "Téléphone" }[k]}
                <input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button onClick={saveEdit} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
