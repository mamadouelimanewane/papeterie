"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Plus, Edit, X, Loader2, Package, Eye, EyeOff } from "lucide-react"
import { merchantFetch, fmtFcfa } from "../MerchantContext"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  status: string
  category: string | null
  stock: number
}

type Draft = { name: string; description: string; price: string; stock: string; category: string; image: string; status: string }

const emptyDraft: Draft = { name: "", description: "", price: "", stock: "0", category: "", image: "", status: "Active" }
const toDraft = (p: Product): Draft => ({
  name: p.name, description: p.description ?? "", price: String(p.price), stock: String(p.stock),
  category: p.category ?? "", image: p.image ?? "", status: p.status,
})

export default function MerchantProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | "new" | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await merchantFetch<Product[]>("/api/merchant/products"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    fetch("/api/categories?status=Active")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCategories(d.map((c: { name: string }) => c.name)))
      .catch(() => {})
  }, [load])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const map = new Map<string, Product[]>()
    for (const p of products) {
      if (q && !p.name.toLowerCase().includes(q) && !(p.category ?? "").toLowerCase().includes(q)) continue
      const key = p.category || "Sans catégorie"
      map.set(key, [...(map.get(key) ?? []), p])
    }
    return [...map.entries()]
  }, [products, search])

  const allCategories = useMemo(
    () => [...new Set([...categories, ...products.map((p) => p.category).filter(Boolean) as string[]])].sort(),
    [categories, products]
  )

  const openEdit = (p: Product | "new") => {
    setEditing(p)
    setDraft(p === "new" ? emptyDraft : toDraft(p))
    setFormError("")
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setFormError("")
    try {
      if (editing === "new") {
        await merchantFetch("/api/merchant/products", { method: "POST", body: draft })
      } else {
        await merchantFetch(`/api/merchant/products/${editing.id}`, { method: "PATCH", body: draft })
      }
      setEditing(null)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (p: Product) => {
    try {
      const updated = await merchantFetch<Product>(`/api/merchant/products/${p.id}`, {
        method: "PATCH", body: { status: p.status === "Active" ? "Inactive" : "Active" },
      })
      setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)))
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erreur")
    }
  }

  const field = (key: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <input
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        {...props}
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catalogue produits</h1>
          <p className="text-sm text-gray-500">{products.length} produit(s) · {products.filter((p) => p.status === "Active").length} en vente</p>
        </div>
        <button onClick={() => openEdit("new")} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Ajouter un produit
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit ou une catégorie…"
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-indigo-500" /></div>
      ) : grouped.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-16">Aucun produit</p>
      ) : (
        grouped.map(([cat, list]) => (
          <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700">
              {cat} <span className="text-gray-400 font-normal">({list.length})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {list.map((p) => (
                <div key={p.id} className={`px-5 py-3 flex items-center gap-3 ${p.status !== "Active" ? "opacity-60" : ""}`}>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {fmtFcfa(p.price)} ·{" "}
                      <span className={p.stock === 0 ? "text-red-600 font-semibold" : p.stock <= 5 ? "text-amber-600 font-semibold" : ""}>
                        stock {p.stock}
                      </span>
                      {p.status !== "Active" && " · masqué"}
                    </div>
                  </div>
                  <button onClick={() => toggleStatus(p)} title={p.status === "Active" ? "Masquer de la vitrine" : "Remettre en vente"}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    {p.status === "Active" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => openEdit(p)} title="Modifier" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editing === "new" ? "Nouveau produit" : `Modifier — ${editing.name}`}</h2>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">{field("name", "Nom *", { required: true })}</div>
              {field("price", "Prix (FCFA) *", { type: "number", min: 0, step: 1, required: true, inputMode: "numeric" })}
              {field("stock", "Stock", { type: "number", min: 0, step: 1, inputMode: "numeric" })}
              <div>
                {field("category", "Catégorie", { list: "merchant-categories" })}
                <datalist id="merchant-categories">{allCategories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Statut</label>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm bg-white">
                  <option value="Active">En vente</option>
                  <option value="Inactive">Masqué</option>
                </select>
              </div>
              <div className="sm:col-span-2">{field("image", "URL de l'image", { type: "url", placeholder: "https://…" })}</div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              {formError && <p className="sm:col-span-2 text-xs text-red-600">{formError}</p>}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
