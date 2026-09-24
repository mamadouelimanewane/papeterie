"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, TrendingUp, Star, Wallet, Clock, CheckCircle, XCircle, Truck, Loader2, Package, AlertTriangle, UserCheck } from "lucide-react"
import { useMerchant, merchantFetch, fmtFcfa, fmtWhen, statusOf, itemsSummary, customerOf } from "../MerchantContext"

interface Stats {
  walletMoney: number
  rating: number
  todayOrders: number
  todayRevenue: number
  totalRevenue: number
  totalCommission: number
  byStatus: Record<string, number>
  recent: { id: string; orderId: string; total: number; status: string; items: unknown; notes: string | null; createdAt: string }[]
  lowStock: { id: string; name: string; stock: number }[]
  topProducts: { name: string; quantity: number; amount: number }[]
}

const STATUS_CARDS = [
  { keys: ["Pending"], label: "En attente", icon: Clock, color: "text-yellow-500 bg-yellow-50 border-yellow-200" },
  { keys: ["Accepted"], label: "Livreur assigné", icon: UserCheck, color: "text-blue-500 bg-blue-50 border-blue-200" },
  { keys: ["Processing"], label: "En livraison", icon: Truck, color: "text-cyan-500 bg-cyan-50 border-cyan-200" },
  { keys: ["Delivered", "Completed"], label: "Livrées", icon: CheckCircle, color: "text-green-500 bg-green-50 border-green-200" },
  { keys: ["Cancelled", "Annule"], label: "Annulées", icon: XCircle, color: "text-red-500 bg-red-50 border-red-200" },
]

export default function MerchantDashboard() {
  const { store } = useMerchant()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    merchantFetch<Stats>("/api/merchant/stats").then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!stats) return <div className="flex justify-center py-20"><Loader2 size={28} className="text-indigo-500 animate-spin" /></div>

  const cards = [
    { label: "Commandes du jour", value: String(stats.todayOrders), icon: ShoppingBag, color: "bg-indigo-500" },
    { label: "Ventes du jour", value: fmtFcfa(stats.todayRevenue), icon: TrendingUp, color: "bg-green-500" },
    { label: "Note moyenne", value: `${stats.rating.toFixed(1)} / 5`, icon: Star, color: "bg-amber-500" },
    { label: "Solde portefeuille", value: fmtFcfa(stats.walletMoney), icon: Wallet, color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Tableau de bord — {store.name}</h1>
        <p className="text-sm text-gray-500">
          Ventes cumulées : {fmtFcfa(stats.totalRevenue)} · {store._count.products} produit(s)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <c.icon size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-lg font-bold text-gray-800 truncate">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUS_CARDS.map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 flex items-center gap-3 ${s.color}`}>
            <s.icon size={20} />
            <div>
              <div className="text-lg font-bold">{s.keys.reduce((n, k) => n + (stats.byStatus[k] ?? 0), 0)}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Commandes récentes</h2>
            <Link href="/merchant/orders" className="text-xs text-indigo-600 hover:underline">Tout voir</Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Aucune commande pour le moment</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recent.map((o) => {
                const st = statusOf(o.status)
                return (
                  <div key={o.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800">{o.orderId} · {customerOf(o.notes)}</div>
                      <div className="text-xs text-gray-500 truncate">{itemsSummary(o.items)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">{fmtFcfa(o.total)}</div>
                      <div className="text-[11px] text-gray-400">{fmtWhen(o.createdAt)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Top produits</h2></div>
            {stats.topProducts.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Pas encore de ventes</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="px-5 py-3 flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.quantity} vendu(s)</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">{fmtFcfa(p.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-semibold text-gray-800">Stock faible</h2>
            </div>
            {stats.lowStock.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Aucun produit sous 5 unités</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.lowStock.map((p) => (
                  <Link key={p.id} href="/merchant/products" className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <Package size={16} className="text-gray-400" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{p.name}</span>
                    <span className={`text-xs font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{p.stock}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
