"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ShoppingBag, TrendingUp, Star, Wallet, Clock, CheckCircle, XCircle, Truck, Loader2, ArrowUp, ArrowDown, Package } from "lucide-react"

const stats = [
  { label: "Commandes du jour",   value: "38",           icon: ShoppingBag, color: "bg-indigo-500", change: "+7 vs hier",  up: true },
  { label: "Chiffre d'affaires",  value: "284 600 FCFA", icon: TrendingUp,  color: "bg-green-500",  change: "+18%",        up: true },
  { label: "Note moyenne",        value: "4.9 / 5",      icon: Star,        color: "bg-amber-500",  change: "stable",      up: null },
  { label: "Solde portefeuille",  value: "315 840 FCFA", icon: Wallet,      color: "bg-purple-500", change: "+24 200",     up: true },
]

const orderStats = [
  { label: "En attente",    count: 5,  icon: Clock,        color: "text-yellow-500 bg-yellow-50 border-yellow-200" },
  { label: "En préparation",count: 8,  icon: ShoppingBag,  color: "text-blue-500 bg-blue-50 border-blue-200" },
  { label: "En livraison",  count: 6,  icon: Truck,        color: "text-cyan-500 bg-cyan-50 border-cyan-200" },
  { label: "Livrées",       count: 19, icon: CheckCircle,  color: "text-green-500 bg-green-50 border-green-200" },
  { label: "Annulées",      count: 2,  icon: XCircle,      color: "text-red-500 bg-red-50 border-red-200" },
]

const recentOrders = [
  { id: "#1042", customer: "Aminata Diallo",   items: "Cahier 100p x5, Stylos BIC x2",              amount: "4 400",  status: "Livré",           time: "14:32", statusColor: "bg-green-100 text-green-700" },
  { id: "#1041", customer: "Oumar Ndiaye",     items: "Livre Maths Terminale S x1, Annales Bac x2", amount: "14 500", status: "En préparation",  time: "14:18", statusColor: "bg-blue-100 text-blue-700" },
  { id: "#1040", customer: "Fatou Sarr",       items: "Kit géométrie x2, Compas x1",                amount: "4 200",  status: "Livré",           time: "13:55", statusColor: "bg-green-100 text-green-700" },
  { id: "#1039", customer: "Ibrahima Ba",      items: "Cartable maternelle CI x1",                  amount: "8 500",  status: "En livraison",    time: "13:20", statusColor: "bg-cyan-100 text-cyan-700" },
  { id: "#1038", customer: "Rokhaya Fall",     items: "Annales BFEM x3, Fiches révision x5",        amount: "9 500",  status: "Annulé",          time: "12:45", statusColor: "bg-red-100 text-red-700" },
]

const topProducts = [
  { name: "Cahier brouillon 96p",       sales: 650, revenue: "195 000", trend: true },
  { name: "Stylo BIC Cristal Lot x10",  sales: 560, revenue: "672 000", trend: true },
  { name: "Crayon HB Lot x12",          sales: 430, revenue: "344 000", trend: false },
  { name: "Cahier 100p petits carreaux",sales: 420, revenue: "210 000", trend: true },
  { name: "Kit géométrie complet",      sales: 342, revenue: "410 400", trend: true },
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store") ?? "1"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tableau de bord — Mon École</h1>
          <p className="text-sm text-gray-500 mt-0.5">Papeterie scolaire en ligne · PAPETERIE · Lundi 16 mars 2026</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <Package size={14} className="text-indigo-600" />
          <span className="text-xs text-indigo-600 font-semibold">1 248 produits actifs</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon size={20} className="text-white" />
              </div>
              {s.up !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${s.up ? "text-green-600" : "text-red-500"}`}>
                  {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {s.change}
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Innovation & Insights IA (New Section) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Heatmap Section */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-800 relative overflow-hidden">
           <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                 <h3 className="text-white font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-400" />
                    Heatmap de la Demande IA
                 </h3>
                 <p className="text-slate-400 text-xs mt-1">Zones de forte affluence en temps réel (Dakar & Banlieue)</p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">Live Insights</span>
              </div>
           </div>
           
           {/* Simulated Heatmap Map Overlay */}
           <div className="h-64 bg-slate-800 rounded-xl relative overflow-hidden border border-slate-700">
              <div className="absolute inset-0 opacity-30 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-17.44,14.71,11/600x400?access_token=mock')] bg-cover" />
              {/* Heatmap Blobs */}
              <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-orange-500/40 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-red-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-yellow-500/40 rounded-full blur-3xl animate-pulse" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700 text-center">
                    <p className="text-white font-bold text-sm">Zone Critique : Almadies 📍</p>
                    <p className="text-indigo-400 text-[10px] mt-1">Surcharge de commandes prévue dans 15 min</p>
                 </div>
              </div>
           </div>
        </div>

        {/* AI Predictive Analytics */}
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-5 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                 <Star size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-800">IA Prédictive Stock</h3>
           </div>
           <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                 <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
                    <Clock size={14} /> Alerte Rupture
                 </div>
                 <p className="text-gray-700 text-sm font-medium">Cahiers 200p (Sérigne Fallu)</p>
                 <p className="text-gray-500 text-xs mt-1">Rupture prévue sous 48h selon le cycle actuel.</p>
                 <button className="mt-2 w-full py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg uppercase">Commander en 1-clic</button>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                 <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
                    <ShoppingBag size={14} /> Opportunité de Groupage
                 </div>
                 <p className="text-gray-700 text-sm font-medium">Kit Géométrie x50</p>
                 <p className="text-gray-500 text-xs mt-1">Besoins groupés détectés via innovation hub (Parcelles Assainies).</p>
              </div>
           </div>
        </div>
      </div>

      {/* Order status row */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        {orderStats.map((o) => (
          <div key={o.label} className={`bg-white rounded-xl border p-3 flex flex-col items-center gap-1 ${o.color}`}>
            <o.icon size={20} />
            <div className="text-xl font-bold">{o.count}</div>
            <div className="text-xs text-center font-medium">{o.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Commandes récentes</h2>
            <a href={`/merchant/orders?store=${storeId}`} className="text-xs text-indigo-500 hover:underline font-medium">Voir tout →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  {order.id.slice(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{order.customer}</div>
                  <div className="text-xs text-gray-400 truncate">{order.items}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-800">{order.amount} FCFA</div>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.statusColor}`}>{order.status}</span>
                    <span className="text-xs text-gray-400">{order.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Top produits</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ce mois-ci · Mon École</p>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducts.map((p, i) => (
              <div key={p.name} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.sales} ventes</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">{p.revenue}</div>
                  {p.trend ? <ArrowUp size={12} className="text-green-500 ml-auto" /> : <ArrowDown size={12} className="text-red-400 ml-auto" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MerchantDashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 size={28} className="text-indigo-500 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}
