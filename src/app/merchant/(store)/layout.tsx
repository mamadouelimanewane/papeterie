"use client"

import { Suspense, useState } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, BookOpen, Wallet,
  Star, User, Settings, Bell, LogOut, Menu, X,
  ChevronRight, Package
} from "lucide-react"
import { Loader2 } from "lucide-react"

const mockStores: Record<string, { name: string; email: string; slug: string }> = {
  "1": { name: "Mon École", email: "contact@monecole.sn", slug: "mon-ecole" },
}

const navItems = [
  { href: "/merchant/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/merchant/orders",    icon: ShoppingBag,     label: "Commandes",        badge: 3 },
  { href: "/merchant/products",  icon: Package,         label: "Catalogue produits" },
  { href: "/merchant/wallet",    icon: Wallet,          label: "Portefeuille" },
  { href: "/merchant/reviews",   icon: Star,            label: "Évaluations" },
  { href: "/merchant/profile",   icon: User,            label: "Profil boutique" },
  { href: "/merchant/settings",  icon: Settings,        label: "Paramètres" },
]

function MerchantSidebar({ storeId, mobile, onClose }: { storeId: string; mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const store = mockStores[storeId] ?? { name: "Mon École", email: "contact@monecole.sn", slug: "mon-ecole" }

  return (
    <aside className={`${mobile ? "w-full" : "w-64"} bg-[#1e2d4a] text-white flex flex-col h-full`}>
      {/* Store header */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            🏫
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{store.name}</div>
            <div className="text-xs text-gray-400 truncate">{store.email}</div>
          </div>
          {mobile && (
            <button onClick={onClose} className="ml-auto p-1 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-xs text-green-400">Boutique en ligne</span>
        </div>
        {/* PAPETERIE badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <BookOpen size={12} className="text-indigo-300" />
          <span className="text-xs text-indigo-300 font-semibold">PAPETERIE · Boutique scolaire</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={`${item.href}?store=${storeId}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <a
          href="/merchant/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </a>
      </div>
    </aside>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store") ?? "1"
  const store = mockStores[storeId] ?? { name: "Mon École", email: "contact@monecole.sn", slug: "mon-ecole" }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-full">
        <MerchantSidebar storeId={storeId} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 z-10">
            <MerchantSidebar storeId={storeId} mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏫</span>
            <span className="font-semibold text-gray-700 text-sm hidden sm:block">{store.name}</span>
            <span className="text-xs text-indigo-500 hidden md:block">· PAPETERIE</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {store.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  )
}
