"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/settings/security", label: "État et politique" },
  { href: "/settings/security/audit", label: "Journal d'audit" },
  { href: "/settings/security/backups", label: "Sauvegardes" },
  { href: "/settings/sub-admin", label: "Administrateurs" },
  { href: "/sub-admin/roles", label: "Rôles et privilèges" },
]

/** En-tête commun des écrans de sécurité. */
export default function SecurityTabs({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const path = usePathname()
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-800">🛡️ {title}</h1>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold ${path === t.href ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-800"}`}>{t.label}</Link>
        ))}
      </nav>
    </>
  )
}
