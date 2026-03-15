"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, X } from "lucide-react"

type Country = {
  id: number
  name: string
  code: string
  flag: string
  phoneCode: string
  currency: string
  currencySymbol: string
  status: boolean
  createdAt: string
}

const INITIAL: Country[] = [
  { id: 1, name: "Senegal", code: "SN", flag: "🇸🇳", phoneCode: "+221", currency: "Franc CFA", currencySymbol: "FCFA", status: true, createdAt: "2025-01-01" },
  { id: 2, name: "France", code: "FR", flag: "🇫🇷", phoneCode: "+33", currency: "Euro", currencySymbol: "€", status: true, createdAt: "2025-01-01" },
  { id: 3, name: "Côte d'Ivoire", code: "CI", flag: "🇨🇮", phoneCode: "+225", currency: "Franc CFA", currencySymbol: "FCFA", status: true, createdAt: "2025-06-01" },
]

const EMPTY: Omit<Country, "id" | "createdAt"> = {
  name: "", code: "", flag: "", phoneCode: "", currency: "", currencySymbol: "", status: true,
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>(INITIAL)
  const [modal, setModal] = useState<{ open: boolean; editing: Country | null }>({ open: false, editing: null })
  const [form, setForm] = useState(EMPTY)

  function openAdd() {
    setForm(EMPTY)
    setModal({ open: true, editing: null })
  }

  function openEdit(c: Country) {
    setForm({ name: c.name, code: c.code, flag: c.flag, phoneCode: c.phoneCode, currency: c.currency, currencySymbol: c.currencySymbol, status: c.status })
    setModal({ open: true, editing: c })
  }

  function save() {
    if (modal.editing) {
      setCountries(countries.map(c => c.id === modal.editing!.id ? { ...c, ...form } : c))
    } else {
      setCountries([...countries, { ...form, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) }])
    }
    setModal({ open: false, editing: null })
  }

  function remove(id: number) {
    if (confirm("Supprimer ce pays ?")) setCountries(countries.filter(c => c.id !== id))
  }

  function toggleStatus(id: number) {
    setCountries(countries.map(c => c.id === id ? { ...c, status: !c.status } : c))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span>🌍</span> Pays
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{countries.length}</span>
        </h1>
        <button onClick={openAdd} className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg">
          <Plus size={14} /> Ajouter un pays
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Drapeau", "Nom", "Code", "Indicatif", "Devise", "Symbole", "Statut", "Créé le", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {countries.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-2xl">{c.flag}</td>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{c.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{c.code}</td>
                <td className="px-4 py-3 text-gray-600">{c.phoneCode}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.currency}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{c.currencySymbol}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.status ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${c.status ? "translate-x-4.5" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={12} /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">{modal.editing ? "Modifier le pays" : "Ajouter un pays"}</h2>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom du pays *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="ex: Senegal" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code ISO (2 lettres) *</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 2) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="SN" maxLength={2} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Drapeau (emoji)</label>
                <input value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="🇸🇳" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Indicatif téléphonique *</label>
                <input value={form.phoneCode} onChange={e => setForm({ ...form, phoneCode: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="+221" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom de la devise *</label>
                <input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Franc CFA" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Symbole de la devise *</label>
                <input value={form.currencySymbol} onChange={e => setForm({ ...form, currencySymbol: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="FCFA" />
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Statut actif</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: !form.status })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.status ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.status ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-xs font-medium ${form.status ? "text-green-600" : "text-gray-400"}`}>{form.status ? "Actif" : "Inactif"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal({ open: false, editing: null })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={save}
                disabled={!form.name || !form.code || !form.phoneCode || !form.currency || !form.currencySymbol}
                className="px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {modal.editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
