"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Save, X, Shield } from "lucide-react"

type Role = {
  id: number
  name: string
  description: string
  permissions: string[]
  adminCount: number
  createdAt: string
}

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

const initialRoles: Role[] = [
  {
    id: 1,
    name: "Super Administrateur",
    description: "Accès complet à toutes les fonctionnalités",
    permissions: ALL_PERMISSIONS,
    adminCount: 2,
    createdAt: "2025-01-01",
  },
  {
    id: 2,
    name: "Gestionnaire Commandes",
    description: "Gère les commandes et les livreurs",
    permissions: ["dashboard.view", "orders.view", "orders.manage", "drivers.view"],
    adminCount: 4,
    createdAt: "2025-03-15",
  },
  {
    id: 3,
    name: "Support Client",
    description: "Accès aux utilisateurs et commandes en lecture seule",
    permissions: ["dashboard.view", "orders.view", "users.view", "drivers.view"],
    adminCount: 6,
    createdAt: "2025-06-10",
  },
]

export default function SubAdminRolesPage() {
  const [roles, setRoles] = useState(initialRoles)
  const [editId, setEditId] = useState<number | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] as string[] })

  const startEdit = (r: Role) => {
    setEditId(r.id)
    setEditPerms([...r.permissions])
  }

  const togglePerm = (perm: string, isNew = false) => {
    if (isNew) {
      setNewRole(p => ({
        ...p,
        permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm],
      }))
    } else {
      setEditPerms(p => p.includes(perm) ? p.filter(x => x !== perm) : [...p, perm])
    }
  }

  const saveEdit = () => {
    setRoles(prev => prev.map(r => r.id === editId ? { ...r, permissions: editPerms } : r))
    setEditId(null)
  }

  const addRole = () => {
    if (!newRole.name) return
    const id = Math.max(...roles.map(r => r.id)) + 1
    setRoles(prev => [...prev, { ...newRole, id, adminCount: 0, createdAt: "2026-03-15" }])
    setNewRole({ name: "", description: "", permissions: [] })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Shield size={18} className="text-purple-600" /> Rôles & Permissions
        </h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg">
          <Plus size={14} /> Nouveau rôle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">Nouveau rôle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom du rôle</label>
              <input value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
                className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input value={newRole.description} onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={newRole.permissions.includes(p)} onChange={() => togglePerm(p, true)}
                    className="accent-blue-500" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addRole} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"><Save size={13} /> Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"><X size={13} /> Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {roles.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{r.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                <span className="text-xs text-purple-600 font-medium">{r.adminCount} administrateur(s)</span>
              </div>
              <div className="flex gap-2">
                {editId === r.id ? (
                  <>
                    <button onClick={saveEdit} className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"><Save size={12} /> Sauver</button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"><X size={12} /> Annuler</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit2 size={13} /></button>
                    {r.id !== 1 && <button onClick={() => setRoles(prev => prev.filter(x => x.id !== r.id))} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={13} /></button>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {ALL_PERMISSIONS.map(p => {
                const hasPerm = editId === r.id ? editPerms.includes(p) : r.permissions.includes(p)
                return (
                  <label key={p} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer ${hasPerm ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                    <input type="checkbox" checked={hasPerm} onChange={() => editId === r.id && togglePerm(p)}
                      disabled={editId !== r.id} className="accent-green-500" />
                    {p}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
