"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"

type PaymentOption = {
  id: number
  name: string
  icon: string
  code: string
  enabled: boolean
  order: number
}

const initialOptions: PaymentOption[] = [
  { id: 1, name: "Espèces", icon: "💵", code: "cash", enabled: true, order: 1 },
  { id: 2, name: "Orange Money", icon: "🟠", code: "orange_money", enabled: true, order: 2 },
  { id: 3, name: "Wave", icon: "🔵", code: "wave", enabled: true, order: 3 },
  { id: 4, name: "Free Money", icon: "🟣", code: "free_money", enabled: false, order: 4 },
  { id: 5, name: "Stripe", icon: "💳", code: "stripe", enabled: false, order: 5 },
]

export default function PaymentOptionsPage() {
  const [options, setOptions] = useState(initialOptions)
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<PaymentOption>>({})
  const [showForm, setShowForm] = useState(false)
  const [newOption, setNewOption] = useState({ name: "", icon: "💳", code: "" })

  const toggleEnabled = (id: number) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o))
  }

  const startEdit = (o: PaymentOption) => {
    setEditId(o.id)
    setEditData({ name: o.name, icon: o.icon, code: o.code })
  }

  const saveEdit = () => {
    setOptions(prev => prev.map(o => o.id === editId ? { ...o, ...editData } : o))
    setEditId(null)
  }

  const deleteOption = (id: number) => {
    setOptions(prev => prev.filter(o => o.id !== id))
  }

  const addOption = () => {
    if (!newOption.name || !newOption.code) return
    const id = Math.max(...options.map(o => o.id)) + 1
    setOptions(prev => [...prev, { ...newOption, id, enabled: false, order: prev.length + 1 }])
    setNewOption({ name: "", icon: "💳", code: "" })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          💳 Options de paiement
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Nouvelle option de paiement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom</label>
              <input value={newOption.name} onChange={e => setNewOption(p => ({ ...p, name: e.target.value }))}
                className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Ex: Mobile Money" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icône (emoji)</label>
              <input value={newOption.icon} onChange={e => setNewOption(p => ({ ...p, icon: e.target.value }))}
                className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none" placeholder="💳" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Code</label>
              <input value={newOption.code} onChange={e => setNewOption(p => ({ ...p, code: e.target.value }))}
                className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none font-mono" placeholder="mobile_money" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addOption} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"><Save size={13} /> Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"><X size={13} /> Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Ordre", "Icône", "Nom", "Code", "Statut", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {options.sort((a, b) => a.order - b.order).map(o => (
              <tr key={o.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{o.order}</td>
                <td className="px-4 py-3 text-xl">{editId === o.id ? (
                  <input value={editData.icon} onChange={e => setEditData(p => ({ ...p, icon: e.target.value }))}
                    className="border rounded px-2 py-1 w-16 text-center" />
                ) : o.icon}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {editId === o.id ? (
                    <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none" />
                  ) : o.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">
                  {editId === o.id ? (
                    <input value={editData.code} onChange={e => setEditData(p => ({ ...p, code: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none" />
                  ) : o.code}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleEnabled(o.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${o.enabled ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow ${o.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                  </button>
                  <span className={`ml-2 text-xs ${o.enabled ? "text-green-600" : "text-gray-400"}`}>{o.enabled ? "Actif" : "Inactif"}</span>
                </td>
                <td className="px-4 py-3">
                  {editId === o.id ? (
                    <div className="flex gap-1">
                      <button onClick={saveEdit} className="p-1 bg-green-500 text-white rounded hover:bg-green-600"><Save size={13} /></button>
                      <button onClick={() => setEditId(null)} className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(o)} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit2 size={13} /></button>
                      <button onClick={() => deleteOption(o.id)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={13} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
