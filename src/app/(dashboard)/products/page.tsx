"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, Loader2, Package, ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react"
import { adminFetch, fmtMoney } from "@/lib/adminApi"
import ProductImageEditor from "@/components/ui/ProductImageEditor"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
  image: string | null
  status: string
  barcode: string | null
  store: { name: string }
}
interface ListResponse { products: Product[]; total: number; page: number; totalPages: number; categories: string[] }

/** Origine de la photo affichée : la vraie photo téléversée, une image illustrative ou aucune. */
function photoKind(image: string | null): { label: string; cls: string } {
  if (!image) return { label: "Aucune photo", cls: "bg-gray-100 text-gray-500" }
  if (image.startsWith("/api/images/")) return { label: "Photo du produit", cls: "bg-emerald-100 text-emerald-700" }
  if (image.startsWith("/generic/") || image.startsWith("https://covers.openlibrary.org/")) return { label: "Image illustrative", cls: "bg-amber-100 text-amber-700" }
  return { label: "Photo (lien)", cls: "bg-blue-100 text-blue-700" }
}

export default function ProductsPage() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [photo, setPhoto] = useState("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams({ page: String(page), perPage: "30" })
      if (query) qs.set("search", query)
      if (category) qs.set("category", category)
      if (photo) qs.set("photo", photo)
      setData(await adminFetch<ListResponse>(`/api/admin/products?${qs}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [page, query, category, photo])

  useEffect(() => { load() }, [load])

  // Recherche différée : évite une requête à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQuery(search.trim()) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const applyImage = (id: string, image: string | null) => {
    setData((d) => d && { ...d, products: d.products.map((p) => (p.id === id ? { ...p, image } : p)) })
    setEditing((e) => (e && e.id === id ? { ...e, image } : e))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Produits</h1>
        <p className="text-sm text-gray-500">
          {data ? `${data.total} produit(s)` : "Chargement…"} · ajoutez, changez ou supprimez la photo de chaque produit.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou code-barres…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Toutes les catégories</option>
          {data?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={photo} onChange={(e) => { setPage(1); setPhoto(e.target.value) }} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Toutes les photos</option>
          <option value="none">Sans photo</option>
          <option value="generic">Image illustrative</option>
          <option value="own">Photo du produit</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading && !data ? (
          <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-brand-500" /></div>
        ) : data && data.products.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Aucun produit</p>
        ) : (
          <div className={`divide-y divide-gray-50 ${loading ? "opacity-60" : ""}`}>
            {data?.products.map((p) => {
              const kind = photoKind(p.image)
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {p.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      : <Package size={20} className="text-gray-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800" data-no-i18n>{p.name}</div>
                    <div className="text-xs text-gray-500">
                      <span data-no-i18n>{p.category ?? "Sans catégorie"}</span> · {fmtMoney(p.price)} · stock {p.stock}
                      {p.status !== "Active" && " · masqué"}
                    </div>
                  </div>
                  <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${kind.cls}`}>{kind.label}</span>
                  <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 rounded-lg bg-sun-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-sun-100">
                    <ImagePlus size={14} /> Photo
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-200 bg-white p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span className="text-gray-600">Page {page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-200 bg-white p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="truncate pr-3 font-semibold text-gray-800" data-no-i18n>{editing.name}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5">
              <ProductImageEditor
                src={editing.image}
                uploadUrl={`/api/admin/products/${editing.id}/image`}
                onChanged={(url) => applyImage(editing.id, url)}
              />
              {editing.image?.startsWith("/generic/") && (
                <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                  Ce produit affiche une image illustrative de son type d&apos;article. Ajoutez sa vraie photo pour la remplacer.
                </p>
              )}
            </div>
            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
              <button onClick={() => setEditing(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
