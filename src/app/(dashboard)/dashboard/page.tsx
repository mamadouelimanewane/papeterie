"use client"

import { useEffect, useState } from "react"
import {
  Users, Globe, Map, Tag, Truck,
  Store, FolderOpen, Package, ShoppingCart, DollarSign, BookOpen, AlertTriangle,
} from "lucide-react"
import StatCard from "@/components/ui/StatCard"
import DashboardCharts from "@/components/dashboard/DashboardCharts"

interface DashboardStats {
  site: {
    totalUsers: number
    activeUsers: number
    totalDrivers: number
    activeDrivers: number
    countries: number
    serviceAreas: number
    totalRevenue: number
    totalEarnings: number
    totalDiscounts: number
  }
  store: {
    totalStores: number
    totalCategories: number
    totalProducts: number
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    cancelledOrders: number
  }
  lowStock: { id: string; name: string; stock: number; store: string }[]
  chartData: { name: string; commandes: number; revenus: number }[]
  categoryStats: { name: string; value: number; color: string }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n.toLocaleString("fr-FR")

  const siteStats = stats
    ? [
        { label: "Clients actifs", value: fmt(stats.site.activeUsers), iconBg: "bg-green-500", icon: <Users size={20} />, href: "/users" },
        { label: "Livreurs actifs", value: fmt(stats.site.activeDrivers), iconBg: "bg-blue-500", icon: <Truck size={20} />, href: "/drivers" },
        { label: "Pays de service", value: fmt(stats.site.countries), iconBg: "bg-orange-500", icon: <Globe size={20} />, href: "/countries" },
        { label: "Zones de livraison", value: fmt(stats.site.serviceAreas), iconBg: "bg-orange-400", icon: <Map size={20} />, href: "/service-areas" },
        { label: "Revenus totaux", value: fmt(stats.site.totalRevenue), iconBg: "bg-cyan-500", icon: <DollarSign size={20} />, href: "/reports/earnings" },
        { label: "Remises accordées", value: fmt(stats.site.totalDiscounts), iconBg: "bg-pink-400", icon: <Tag size={20} />, href: "/promo-code" },
      ]
    : [
        { label: "Clients actifs", value: "—", iconBg: "bg-green-500", icon: <Users size={20} />, href: "/users" },
        { label: "Livreurs actifs", value: "—", iconBg: "bg-blue-500", icon: <Truck size={20} />, href: "/drivers" },
        { label: "Pays de service", value: "—", iconBg: "bg-orange-500", icon: <Globe size={20} />, href: "/countries" },
        { label: "Zones de livraison", value: "—", iconBg: "bg-orange-400", icon: <Map size={20} />, href: "/service-areas" },
        { label: "Revenus totaux", value: "—", iconBg: "bg-cyan-500", icon: <DollarSign size={20} />, href: "/reports/earnings" },
        { label: "Remises accordées", value: "—", iconBg: "bg-pink-400", icon: <Tag size={20} />, href: "/promo-code" },
      ]

  const monEcoleStats = stats
    ? [
        { label: "Mon École (boutique)", value: fmt(stats.store.totalStores), iconBg: "bg-indigo-500", icon: <Store size={20} />, href: "/stores" },
        { label: "Catégories actives", value: fmt(stats.store.totalCategories), iconBg: "bg-cyan-500", icon: <FolderOpen size={20} />, href: "/categories" },
        { label: "Total produits", value: fmt(stats.store.totalProducts), iconBg: "bg-teal-500", icon: <Package size={20} />, href: "/stores" },
        { label: "Total commandes", value: fmt(stats.store.totalOrders), iconBg: "bg-orange-500", icon: <ShoppingCart size={20} />, href: "/orders" },
        { label: "Revenus boutique", value: fmt(stats.site.totalRevenue), iconBg: "bg-green-500", icon: <DollarSign size={20} />, href: "/reports/earnings" },
        { label: "Livres scolaires", value: "—", iconBg: "bg-blue-500", icon: <BookOpen size={20} />, href: "/categories" },
      ]
    : [
        { label: "Mon École (boutique)", value: "—", iconBg: "bg-indigo-500", icon: <Store size={20} />, href: "/stores" },
        { label: "Catégories actives", value: "—", iconBg: "bg-cyan-500", icon: <FolderOpen size={20} />, href: "/categories" },
        { label: "Total produits", value: "—", iconBg: "bg-teal-500", icon: <Package size={20} />, href: "/stores" },
        { label: "Total commandes", value: "—", iconBg: "bg-orange-500", icon: <ShoppingCart size={20} />, href: "/orders" },
        { label: "Revenus boutique", value: "—", iconBg: "bg-green-500", icon: <DollarSign size={20} />, href: "/reports/earnings" },
        { label: "Livres scolaires", value: "—", iconBg: "bg-blue-500", icon: <BookOpen size={20} />, href: "/categories" },
      ]

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/30">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="text-4xl filter drop-shadow-md">📚</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Bienvenue sur Papeterie</h1>
            <p className="text-indigo-100 text-xs md:text-sm mt-1 max-w-2xl opacity-90">
              Plateforme multi-boutiques — Boutique active : <strong>Mon École</strong> · Papeterie & fournitures scolaires au Sénégal
            </p>
          </div>
          {loading && (
            <div className="ml-auto flex items-center gap-2 text-indigo-200 text-xs">
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
              Chargement...
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aperçu Global</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {siteStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="animate-in fade-in duration-700">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Analyses de Performance (7 derniers jours)</h2>
        </div>
        <DashboardCharts chartData={stats?.chartData} categoryStats={stats?.categoryStats} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <span className="text-lg">🏫</span>
              <h2 className="text-sm font-bold text-gray-700 uppercase">Mon École — Digital Store</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {monEcoleStats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          {stats && (
            <section className="grid grid-cols-4 gap-3">
              {[
                { label: "En attente", value: stats.store.pendingOrders, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
                { label: "Livrées", value: stats.store.completedOrders, color: "text-green-600 bg-green-50 border-green-100" },
                { label: "Annulées", value: stats.store.cancelledOrders, color: "text-red-600 bg-red-50 border-red-100" },
                { label: "Total", value: stats.store.totalOrders, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
                  <p className="text-2xl font-bold">{fmt(s.value)}</p>
                  <p className="text-xs font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        <section className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-orange-700 uppercase flex items-center gap-2">
              <AlertTriangle size={14} /> Alerte Stocks Faibles
            </h2>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-lg uppercase">Priorité : Haute</span>
          </div>
          <div className="space-y-3">
            {stats && stats.lowStock.length > 0 ? (
              stats.lowStock.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-500">{item.store}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600">Pcs: {item.stock}</p>
                    <button className="text-[10px] text-indigo-600 font-bold hover:underline">Approvisionner →</button>
                  </div>
                </div>
              ))
            ) : loading ? (
              <p className="text-xs text-gray-400 text-center py-4">Chargement...</p>
            ) : (
              <p className="text-xs text-green-600 text-center py-4">Aucun produit en stock faible ✓</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
