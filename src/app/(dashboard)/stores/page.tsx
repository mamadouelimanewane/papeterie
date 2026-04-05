"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Info, Search, RefreshCw, Edit, Eye, BarChart2, Copy, Check, X, ExternalLink } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import Link from "next/link"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

interface Store {
  id: string
  name: string
  phone: string | null
  email: string
  address: string | null
  image: string | null
  rating: number
  walletMoney: number
  status: string
  serviceArea: string | null
  segment: string
  totalOrders: number
  createdAt: string
  _count: { orders: number; products: number }
}

function generateToken(storeId: string, email: string): string {
  return btoa(`store:${storeId}:${email}:papeterie2024`).replace(/=/g, "")
}

function getLoginUrl(store: Store): string {
  const token = generateToken(store.id, store.email)
  const base = BASE_URL || (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/merchant/login?store=${store.id}&token=${token}`
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ name: "", email: "", phone: "" })
  const [urlModal, setUrlModal] = useState<{ open: boolean; store: Store | null }>({ open: false, store: null })
  const [copied, setCopied] = useState(false)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.name) params.set("search", search.name)
      const res = await fetch(`/api/stores?${params}`)
      const data = await res.json()
      if (!Array.isArray(data.error)) setStores(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [search.name])

  useEffect(() => { fetchStores() }, [fetchStores])

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.name.toLowerCase()) &&
      s.email.toLowerCase().includes(search.email.toLowerCase()) &&
      (s.phone ?? "").includes(search.phone)
  )

  const openUrlModal = (store: Store) => { setUrlModal({ open: true, store }); setCopied(false) }

  const copyUrl = async () => {
    if (!urlModal.store) return
    await navigator.clipboard.writeText(getLoginUrl(urlModal.store))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">🏫</span>
          <h1 className="text-lg font-semibold text-gray-700">Boutiques Papeterie</h1>
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <Link href="/stores/new">
            <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center">
              <Plus size={16} />
            </button>
          </Link>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <span className="text-2xl">🎒</span>
        <div>
          <p className="text-sm font-semibold text-indigo-800">Papeterie — Plateforme multi-boutiques</p>
          <p className="text-xs text-indigo-600">{stores.length} boutique(s) active(s) — Papeterie & fournitures scolaires au Sénégal.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row flex-wrap gap-3 items-end">
          {(["name", "email", "phone"] as const).map((field) => (
            <div key={field} className="w-full md:w-48">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block capitalize">{field === "name" ? "Nom" : field === "email" ? "Email" : "Téléphone"}</label>
              <input
                placeholder={field === "name" ? "Ex: Mon École" : field === "email" ? "contact@..." : "77..."}
                value={search[field]}
                onChange={(e) => setSearch({ ...search, [field]: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={fetchStores} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Search size={16} /></button>
            <button onClick={() => { setSearch({ name: "", email: "", phone: "" }); fetchStores() }} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Coordonnées", "Adresse", "Commandes", "Produits", "URL connexion", "Note", "Solde (FCFA)", "Statut", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Aucune boutique trouvée</td></tr>
            ) : (
              filtered.map((store, i) => (
                <tr key={store.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">🏫 {store.name}</div>
                    <div className="text-gray-500 text-xs">Tél. : {store.phone ?? "—"}</div>
                    <div className="text-gray-400 text-xs">{store.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{store.address ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-medium text-orange-600">{store._count.orders}</td>
                  <td className="px-4 py-3 text-xs font-medium text-teal-600">{store._count.products}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openUrlModal(store)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600">
                      <Copy size={12} /> URL connexion
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-700">{store.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{store.walletMoney.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge status={store.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Modifier"><Edit size={14} /></button>
                      <button className="p-1 text-green-500 hover:bg-green-50 rounded" title="Voir"><Eye size={14} /></button>
                      <button className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"><BarChart2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t">
          {filtered.length} boutique(s) affichée(s)
        </div>
      </div>

      {/* URL Modal */}
      {urlModal.open && urlModal.store && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">URL de connexion</h2>
                <p className="text-xs text-gray-500 mt-0.5">{urlModal.store.name}</p>
              </div>
              <button onClick={() => setUrlModal({ open: false, store: null })} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🏫</div>
                <div>
                  <div className="font-medium text-gray-800 text-sm">{urlModal.store.name}</div>
                  <div className="text-xs text-gray-500">{urlModal.store.email}</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Lien de connexion</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-600 break-all flex-1 font-mono">{getLoginUrl(urlModal.store)}</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700">📧 Envoyez ce lien au responsable pour lui donner accès à son espace de gestion.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={copyUrl}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium ${copied ? "bg-green-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              <a href={getLoginUrl(urlModal.store)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">
                <ExternalLink size={16} /> Ouvrir
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
