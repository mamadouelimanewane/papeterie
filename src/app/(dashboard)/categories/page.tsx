"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Download, Info, Search, RefreshCw, Edit, Trash2 } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

interface Category {
  id: string
  name: string
  segment: string
  parentCategory: string | null
  image: string | null
  sequence: number
  status: string
  createdAt: string
}

function exportCSV(categories: Category[]) {
  const headers = ["Nom", "Segment", "Catégorie parente", "Statut", "Ordre", "Créé le"]
  const rows = categories.map((c) => [c.name, c.segment, c.parentCategory ?? "Aucune", c.status, c.sequence, new Date(c.createdAt).toLocaleDateString("fr-FR")])
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `categories_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", parentCategory: "", sequence: "1", status: "Active" })
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/categories?${params}`)
      const data = await res.json()
      if (Array.isArray(data)) setCategories(data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  async function addCategory() {
    if (!form.name) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          parentCategory: form.parentCategory || null,
          sequence: Number(form.sequence),
          status: form.status,
        }),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm({ name: "", parentCategory: "", sequence: "1", status: "Active" })
        fetchCategories()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return
    await fetch(`/api/categories/${id}`, { method: "DELETE" })
    fetchCategories()
  }

  async function toggleStatus(cat: Category) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: cat.status === "Active" ? "Inactive" : "Active" }),
    })
    fetchCategories()
  }

  const parents = categories.filter((c) => !c.parentCategory)
  const stats = {
    total: categories.length,
    parents: parents.length,
    children: categories.filter((c) => c.parentCategory).length,
    active: categories.filter((c) => c.status === "Active").length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>🎒</span>
          <h1 className="text-lg font-semibold text-gray-700">Catégories — Fournitures Scolaires</h1>
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(categories)} className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Exporter CSV"><Download size={16} /></button>
          <button onClick={() => setShowAdd(true)} className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Ajouter"><Plus size={16} /></button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center" title="Aide"><Info size={16} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total catégories", value: stats.total, color: "bg-indigo-500" },
          { label: "Catégories parentes", value: stats.parents, color: "bg-green-500" },
          { label: "Sous-catégories", value: stats.children, color: "bg-cyan-500" },
          { label: "Actives", value: stats.active, color: "bg-orange-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>{s.value}</div>
            <span className="text-xs text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-3">
          <input
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-64"
          />
          <button onClick={() => setSearch("")} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
          <button onClick={fetchCategories} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Search size={16} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Segment", "Nom", "Catégorie parente", "Statut", "Ordre", "Créé le", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Aucune catégorie trouvée</td></tr>
            ) : (
              categories.map((cat, i) => (
                <tr key={cat.id} className={`hover:bg-gray-50/80 ${!cat.parentCategory ? "bg-indigo-50/30" : ""}`}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{cat.segment}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${!cat.parentCategory ? "text-gray-900" : "text-gray-700 pl-3 border-l-2 border-indigo-200"}`}>
                      {cat.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cat.parentCategory ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{cat.sequence}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(cat.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleStatus(cat)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="Modifier statut"><Edit size={12} /></button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Supprimer"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t">{categories.length} catégorie(s)</div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Nouvelle catégorie</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nom *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Catégorie parente</label>
                <select value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">— Aucune (catégorie principale) —</option>
                  {parents.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ordre d&apos;affichage</label>
                <input type="number" value={form.sequence} onChange={(e) => setForm({ ...form, sequence: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={addCategory} disabled={submitting || !form.name}
                className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50">
                {submitting ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
