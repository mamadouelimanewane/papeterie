"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, Settings, Tag, Store, FileText, ShoppingCart,
  Image, Users, Megaphone, Wallet, BarChart2,
  BarChart, ChevronDown, ChevronRight, LogOut, UserCog, Globe,
  Bookmark, Bell, DollarSign, Receipt, Package, BookOpen,
  GraduationCap, ShoppingBag, FolderOpen,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/context/SidebarContext"

type NavItem = {
  label: string
  href?: string
  icon?: React.ReactNode
  children?: NavItem[]
}

const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: "",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    section: "CONFIGURATION",
    items: [
      {
        label: "Configuration", icon: <Settings size={16} />,
        children: [
          { label: "Pays", href: "/countries", icon: <Globe size={14} /> },
          { label: "Zone de service", href: "/service-areas", icon: <Globe size={14} /> },
          { label: "Catégories", href: "/categories", icon: <Tag size={14} /> },
        ],
      },
      { label: "Codes promo", href: "/promo-code", icon: <Tag size={16} /> },
      { label: "Créneaux de livraison", href: "/service-time-slots", icon: <ShoppingBag size={16} /> },
    ],
  },
  {
    section: "GESTION BOUTIQUES",
    items: [
      { label: "Boutiques", href: "/stores", icon: <Store size={16} /> },
      { label: "Factures", href: "/invoices", icon: <Receipt size={16} /> },
      { label: "Commandes", href: "/orders", icon: <ShoppingCart size={16} /> },
      { label: "Produits", href: "/stores", icon: <Package size={16} /> },
      { label: "Bannières accueil", href: "/slider", icon: <Image size={16} /> },
    ],
  },
  {
    section: "CATALOGUE SCOLAIRE",
    items: [
      {
        label: "Livres scolaires", icon: <BookOpen size={16} />,
        children: [
          { label: "Primaire (CI → CM2)", href: "/categories" },
          { label: "Collège (6ème → 3ème)", href: "/categories" },
          { label: "Lycée (2nde → Terminale)", href: "/categories" },
        ],
      },
      {
        label: "Fournitures", icon: <GraduationCap size={16} />,
        children: [
          { label: "Cahiers & Blocs", href: "/categories" },
          { label: "Stylos & Crayons", href: "/categories" },
          { label: "Matériel de géométrie", href: "/categories" },
          { label: "Art & Créativité", href: "/categories" },
          { label: "Sacs & Cartables", href: "/categories" },
        ],
      },
      {
        label: "Supports de révision", icon: <FolderOpen size={16} />,
        children: [
          { label: "Annales & Examens", href: "/categories" },
          { label: "Dictionnaires", href: "/categories" },
        ],
      },
    ],
  },
  {
    section: "GESTION UTILISATEURS",
    items: [
      { label: "Clients", href: "/users", icon: <Users size={16} /> },
    ],
  },
  {
    section: "CONTENU & MARKETING",
    items: [
      {
        label: "Gestion du contenu", icon: <Bookmark size={16} />,
        children: [
          { label: "Pages", href: "/content/pages" },
          { label: "FAQ", href: "/content/faqs" },
          { label: "Textes application", href: "/content/app-strings" },
          { label: "Options de paiement", href: "/content/payment-options" },
        ],
      },
      { label: "Notifications promo", href: "/notifications", icon: <Bell size={16} /> },
      { label: "Recharge portefeuille", href: "/wallet", icon: <Wallet size={16} /> },
    ],
  },
  {
    section: "TRANSACTIONS",
    items: [
      {
        label: "Demandes de retrait", icon: <DollarSign size={16} />,
        children: [
          { label: "Retrait boutiques", href: "/cashout/stores" },
        ],
      },
    ],
  },
  {
    section: "RAPPORTS",
    items: [
      {
        label: "Revenus", icon: <BarChart2 size={16} />,
        children: [
          { label: "Gains boutiques", href: "/reports/earnings/stores" },
        ],
      },
      {
        label: "Transactions", icon: <BarChart size={16} />,
        children: [
          { label: "Toutes les transactions", href: "/reports/transactions" },
          { label: "Portefeuille clients", href: "/reports/transactions/user" },
          { label: "Portefeuille boutiques", href: "/reports/transactions/business" },
          { label: "Rapport de solde", href: "/reports/transactions/balance" },
        ],
      },
    ],
  },
  {
    section: "PARAMÈTRES",
    items: [
      {
        label: "Sous-admins", icon: <UserCog size={16} />,
        children: [
          { label: "Tous les admins", href: "/settings/sub-admin" },
          { label: "Ajouter un admin", href: "/settings/sub-admin/new" },
          { label: "Rôles & Permissions", href: "/sub-admin/roles" },
        ],
      },
      {
        label: "Paramètres & Config.", icon: <Settings size={16} />,
        children: [
          { label: "Configuration générale", href: "/settings/configuration" },
          { label: "Config. email", href: "/settings/configuration/email" },
          { label: "Modèles email", href: "/settings/configuration/email-templates" },
          { label: "URLs application", href: "/settings/configuration/app-url" },
          { label: "Push notifications", href: "/settings/configuration/push-notification" },
          { label: "Méthodes de paiement", href: "/settings/configuration/payment-method" },
          { label: "Profil", href: "/settings/profile" },
        ],
      },
    ],
  },
]

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false

  if (item.children) {
    const hasActiveChild = item.children.some(
      (c) => c.href && (pathname === c.href || pathname.startsWith(c.href + "/"))
    )
    const expanded = open || hasActiveChild

    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2 text-sm rounded-md transition-colors",
            depth > 0 ? "pl-8" : "",
            hasActiveChild ? "text-indigo-600 bg-indigo-50" : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expanded && (
          <div className="ml-2 border-l border-gray-100 mt-1">
            {item.children.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
        depth > 0 ? "pl-8" : "",
        isActive
          ? "bg-indigo-50 text-indigo-600 font-medium"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()

  // Auto-close sidebar on mobile when navigating
  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-14 left-0 h-[calc(100vh-3.4rem)] bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-xl md:shadow-none",
        open ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-60 md:translate-x-0"
      )}>
        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
          {navigation.map((group) => (
            <div key={group.section} className="mb-2">
              {group.section && (
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => (
                <div key={item.label} onClick={item.href ? handleLinkClick : undefined}>
                  <NavLink item={item} />
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom icons */}
        <div className="border-t border-gray-100 p-3 flex items-center justify-around bg-gray-50/50">
          <Link href="/settings/configuration" className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100">
            <Settings size={18} />
          </Link>
          <Link href="/settings/profile" className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100">
            <Users size={18} />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all shadow-sm border border-transparent hover:border-red-100"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}
