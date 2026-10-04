"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, ShoppingBag, BookOpen, Wallet,
  Star, User, Settings, LogOut, Menu, X,
  ChevronRight, Package, Loader2,
} from "lucide-react"
import { MerchantContext, merchantFetch, type MerchantStore } from "./MerchantContext"

const navItems = [
  { href: "/merchant/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/merchant/orders",    icon: ShoppingBag,     label: "Commandes" },
  { href: "/merchant/products",  icon: Package,         label: "Catalogue produits" },
  { href: "/merchant/wallet",    icon: Wallet,          label: "Portefeuille" },
  { href: "/merchant/reviews",   icon: Star,            label: "Évaluations" },
  { href: "/merchant/profile",   icon: User,            label: "Profil boutique" },
  { href: "/merchant/settings",  icon: Settings,        label: "Paramètres" },
]

const logout = () => signOut({ callbackUrl: "/merchant/login" })

function MerchantSidebar({ store, mobile, onClose }: { store: MerchantStore; mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className={`${mobile ? "w-full" : "w-64"} bg-[#1e2d4a] text-white flex flex-col h-full`}>
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
            {store.image ? <img src={store.image} alt="" className="w-full h-full object-cover" /> : "🏫"}
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
        <div className="mt-2 flex items-center gap-1.5">
          <BookOpen size={12} className="text-indigo-300" />
          <span className="text-xs text-indigo-300 font-semibold">Espace marchand · Schoolmatik</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [store, setStore] = useState<MerchantStore | null>(null)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // La boutique vient de la session côté serveur (jamais d'un paramètre d'URL)
  useEffect(() => {
    merchantFetch<MerchantStore>("/api/merchant/me")
      .then(setStore)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
  }, [])

  if (!store) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        {error ? (
          <>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => router.replace("/merchant/login")} className="text-sm text-indigo-600 hover:underline">
              Retour à la connexion
            </button>
          </>
        ) : (
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        )}
      </div>
    )
  }

  return (
    <MerchantContext.Provider value={{ store, setStore }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <div className="hidden lg:flex flex-col h-full">
          <MerchantSidebar store={store} />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 z-10">
              <MerchantSidebar store={store} mobile onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">🏫</span>
              <span className="font-semibold text-gray-700 text-sm truncate">{store.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {store.name.charAt(0)}
              </div>
              <button onClick={logout} title="Déconnexion" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </MerchantContext.Provider>
  )
}
