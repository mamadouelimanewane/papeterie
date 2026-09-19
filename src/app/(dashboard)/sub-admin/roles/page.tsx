"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Save, X, Shield } from "lucide-react"

type Role = { id: string; name: string; description: string | null; permissions: string[]; status: string }

const ALL_PERMISSIONS = [
  "dashboard.view",
  "orders.view", "orders.manage",
  "users.view", "users.manage",
  "drivers.view", "drivers.manage", "drivers.approve",
  "stores.view", "stores.manage",
  "reports.view", "reports.export",
  "settings.view", "settings.manage",
  "content.view", "content.manage",
  "notifications.send",
  "wallet.view", "wallet.manage",
]
const LABEL: Record<string, string> = {
  "dashboard.view": "Voir le tableau de bord",
  "orders.view": "Voir les commandes", "orders.manage": "Gérer les commandes",
  "users.view": "Voir les clients", "users.manage": "Gérer les clients",
  "drivers.view": "Voir les livreurs", "drivers.manage": "Gérer les livreurs", "drivers.approve": "Approuver les livreurs",
  "stores.view": "Voir la boutique", "stores.manage": "Gérer la boutique",
  "reports.view": "Voir les rapports", "reports.export": "Exporter les rapports",
  "settings.view": "Voir les paramètres", "settings.manage": "Gérer les paramètres",
  "content.view": "Voir le contenu", "content.manage": "Gérer le contenu",
  "notifications.send": "Envoyer des notifications",
  "wallet.view": "Voir le portefeuille", "wallet.manage": "Gérer le portefeuille",
}

export default function SubAdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] as string[] })

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch("/api/admin/roles"); const d = await r.json(); setRoles(Array.isArray(d) ? d : []) }
    catch { setRoles([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const startEdit = (r: Role) => { setEditId(r.id); setEditPerms([...(r.permissions || [])]) }
  const togglePerm = (perm: string, isNew = false) => {
    if (isNew) setNewRole(p => ({ ...p, permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm] }))
    else setEditPerms(p => p.includes(perm) ? p.filter(x => x !== perm) : [...p, perm])
  }
  async function saveEdit() {
    if (!editId) return
    const res = await fetch(`/api/admin/roles/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: editPerms }) })
    setMsg(res.ok ? "Permissions enregistrées" : "Erreur"); setEditId(null); if (res.ok) load()
  }
  async function addRole() {
    if (!newRole.name) return
    const res = await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newRole) })
    const d = await res.json()
    if (res.ok) { setMsg(`Rôle "${newRole.name}" créé`); setNewRole({ name: "", description: "", permissions: [] }); setShowForm(false); load() }
    else setMsg(d.error ?? "Erreur")
  }
  async function removeRole(r: Role) {
    if (!confirm(`Supprimer le rôle "${r.name}" ?`)) return
    const res = await fetch(`/api/admin/roles/${r.id}`, { method: "DELETE" })
    setMsg(res.ok ? `Rôle "${r.name}" supprimé` : "Erreur"); if (res.ok) load()
  }

  const permGrid = (selected: string[], isNew: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {ALL_PERMISSIONS.map(p => (
        <label key={p} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50">
          <input type="checkbox" checked={selected.includes(p)} onChange={() => togglePerm(p, isNew)} className="h-3.5 w-3.5 accent-indigo-600" />
          <span>{LABEL[p] ?? p}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Shield size={18} className="text-purple-600" /> Rôles &amp; Permissions</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"><Plus size={14} /> Nouveau rôle</button>
      </div>
      {msg && <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{msg}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={newRole.name} onChange={e => setNewRole({ ...newRole, name: e.target.value })} placeholder="Nom du rôle" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })} placeholder="Description" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {permGrid(newRole.permissions, true)}
          <div className="flex gap-2">
            <button onClick={addRole} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Créer le rôle</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      <div className="space-y-3">
        {roles.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800">{r.name}</h3>
                <p className="text-xs text-gray-500">{r.description}</p>
                <p className="mt-1 text-xs text-gray-400">{(r.permissions?.length ?? 0)} permission(s)</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {editId === r.id
                  ? <><button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg"><Save size={12} /> Enregistrer</button>
                       <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg"><X size={12} /></button></>
                  : <><button onClick={() => startEdit(r)} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">Modifier les permissions</button>
                       <button onClick={() => removeRole(r)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={12} /></button></>}
              </div>
            </div>
            {editId === r.id
              ? <div className="mt-3">{permGrid(editPerms, false)}</div>
              : <div className="mt-2 flex flex-wrap gap-1">{(r.permissions || []).slice(0, 8).map(p => <span key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{LABEL[p] ?? p}</span>)}{(r.permissions?.length ?? 0) > 8 && <span className="text-[10px] text-gray-400">+{(r.permissions.length - 8)}…</span>}</div>}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Les rôles et permissions sont enregistrés en base. L'assignation d'un rôle à un compte se fait dans « Utilisateurs &amp; rôles ».</p>
    </div>
  )
}
