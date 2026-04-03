import {
  Users, Globe, Map, Tag, Truck,
  Store, FolderOpen, Package, ShoppingCart, DollarSign, BookOpen,
} from "lucide-react"
import StatCard from "@/components/ui/StatCard"

const siteStats = [
  { label: "Clients actifs",      value: "3 847",      iconBg: "bg-green-500",  icon: <Users size={20} />,       href: "/users" },
  { label: "Livreurs actifs",     value: "12",         iconBg: "bg-blue-500",   icon: <Truck size={20} />,       href: "/drivers" },
  { label: "Pays de service",     value: "1",          iconBg: "bg-orange-500", icon: <Globe size={20} />,       href: "/countries" },
  { label: "Zones de livraison",  value: "5",          iconBg: "bg-orange-400", icon: <Map size={20} />,         href: "/service-areas" },
  { label: "Revenus totaux",      value: "1 248 650",  iconBg: "bg-cyan-500",   icon: <DollarSign size={20} />,  href: "/reports/earnings" },
  { label: "Remises accordées",   value: "37 500",     iconBg: "bg-pink-400",   icon: <Tag size={20} />,         href: "/promo-code" },
]

const monEcoleStats = [
  { label: "Mon École (boutique)", value: "1",           iconBg: "bg-indigo-500", icon: <Store size={20} />,       href: "/stores" },
  { label: "Catégories actives",   value: "50",          iconBg: "bg-cyan-500",   icon: <FolderOpen size={20} />,  href: "/categories" },
  { label: "Total produits",       value: "1 248",       iconBg: "bg-teal-500",   icon: <Package size={20} />,     href: "/stores" },
  { label: "Total commandes",      value: "6 431",       iconBg: "bg-orange-500", icon: <ShoppingCart size={20} />, href: "/orders" },
  { label: "Revenus boutique",     value: "1 248 650",   iconBg: "bg-green-500",  icon: <DollarSign size={20} />,  href: "/reports/earnings" },
  { label: "Livres scolaires",     value: "324",         iconBg: "bg-blue-500",   icon: <BookOpen size={20} />,    href: "/categories" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Bannière de bienvenue */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🎒</div>
          <div>
            <h1 className="text-xl font-bold">Bienvenue sur LELUMA</h1>
            <p className="text-indigo-100 text-sm mt-0.5">Plateforme multi-boutiques — Boutique active : <strong>Mon École</strong> · Papeterie scolaire en ligne au Sénégal</p>
          </div>
        </div>
      </div>

      {/* Statistiques du site */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Statistiques globales LELUMA</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {siteStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Statistiques Mon École */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <span className="text-lg">🏫</span>
          <h2 className="text-base font-semibold text-gray-700">Statistiques — Mon École</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {monEcoleStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
    </div>
  )
}
