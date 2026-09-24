"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Key } from "lucide-react"
import Link from "next/link"

type Admin = { id: string; name: string; email: string; role: string; status: string; createdAt: string }

export default function SubAdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [roleNames, setRoleNames] = useState<string[]>(["Super Admin"])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const d = await res.json()
      setAdmins(Array.isArray(d) ? d : [])
    } catch { setAdmins([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch("/api/admin/roles").then(r => r.json()).then((d) => {
      if (Array.isArray(d)) setRoleNames(["Super Admin", ...d.map((r: any) => r.name)])
    }).catch(() => {})
  }, [])
  const ROLES = roleNames

  async function patch(id: string, body: any, okText: string) {
    setMsg(null)
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const d = await res.json()
    setMsg(res.ok ? okText : (d.error ?? "Erreur"))
    if (res.ok) load()
  }
  async function changeRole(a: Admin, role: string) { if (role !== a.role) patch(a.id, { role }, `Rôle de ${a.name} → ${role}`) }
  async function toggleStatus(a: Admin) { patch(a.id, { status: a.status === "Active" ? "Inactive" : "Active" }, `Statut de ${a.name} mis à jour`) }
  async function resetPassword(a: Admin) {
    const p = window.prompt(`Nouveau mot de passe pour ${a.name} :`)
    if (p && p.length >= 4) patch(a.id, { password: p }, `Mot de passe de ${a.name} réinitialisé`)
    else if (p) alert("Mot de passe trop court (min. 4 caractères)")
  }
  async function remove(a: Admin) {
    if (!confirm(`Supprimer le compte ${a.name} (${a.email}) ?`)) return
    const res = await fetch(`/api/admin/users/${a.id}`, { method: "DELETE" })
    const d = await res.json()
    setMsg(res.ok ? `${a.name} supprimé` : (d.error ?? "Erreur"))
    if (res.ok) load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><span>👤</span> Utilisateurs &amp; rôles</h1>
        <Link href="/settings/sub-admin/new" className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"><Plus size={14} /> Ajouter un admin</Link>
      </div>
      {msg && <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{msg}</div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["N°", "Nom", "Email", "Rôle", "Statut", "Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Chargement…</td></tr>}
            {!loading && admins.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucun compte.</td></tr>}
            {admins.map((a, i) => (
              <tr key={a.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{a.name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.email}</td>
                <td className="px-4 py-3">
                  <select value={ROLES.includes(a.role) ? a.role : ROLES[0]} onChange={e => changeRole(a, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(a)} className={`px-2 py-0.5 text-xs rounded-full font-medium ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{a.status}</button>
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button onClick={() => resetPassword(a)} className="p-1.5 bg-orange-500 text-white rounded hover:bg-orange-600" title="Réinitialiser le mot de passe"><Key size={12} /></button>
                  <button onClick={() => remove(a)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Supprimer"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Le rôle se change directement dans la liste. La clé réinitialise le mot de passe.</p>
    </div>
  )
}
