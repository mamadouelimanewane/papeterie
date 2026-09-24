"use client"

import { ArrowLeft, Maximize2, Minimize2, Bell, Globe, ChevronDown, Menu, X, User, LogOut, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useSidebar } from "@/context/SidebarContext"
import { useI18n, type Lang } from "@/i18n/I18nProvider"

type Alerts = { pendingOrders: number; pendingDrivers: number; pendingCashouts: number; expiringDocs: number; latest: { id: string; orderId: string; total: number; createdAt: string }[] }

/** Menu déroulant fermé au clic extérieur / Échap. */
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])
  return { open, setOpen, ref }
}

const initials = (name?: string | null) => (name ?? "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()

export default function Header() {
  const router = useRouter()
  const { open, toggle } = useSidebar()
  const { data: session } = useSession()
  const { lang, setLang } = useI18n()
  const [fullscreen, setFullscreen] = useState(false)
  const [alerts, setAlerts] = useState<Alerts | null>(null)
  const { open: bellOpen, setOpen: setBellOpen, ref: bellRef } = useDropdown()
  const { open: langOpen, setOpen: setLangOpen, ref: langRef } = useDropdown()
  const { open: userOpen, setOpen: setUserOpen, ref: userRef } = useDropdown()

  const loadAlerts = useCallback(() => {
    fetch("/api/admin/alerts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setAlerts).catch(() => {})
  }, [])
  useEffect(() => {
    loadAlerts()
    const id = setInterval(loadAlerts, 60_000)
    return () => clearInterval(id)
  }, [loadAlerts])

  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", on)
    return () => document.removeEventListener("fullscreenchange", on)
  }, [])
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const total = alerts ? alerts.pendingOrders + alerts.pendingDrivers + alerts.pendingCashouts + alerts.expiringDocs : 0
  const items = alerts ? [
    { n: alerts.pendingOrders, label: "commande(s) en attente", href: "/orders" },
    { n: alerts.pendingDrivers, label: "livreur(s) à approuver", href: "/drivers/pending" },
    { n: alerts.pendingCashouts, label: "demande(s) de retrait", href: "/cashout/drivers" },
    { n: alerts.expiringDocs, label: "document(s) expirant bientôt", href: "/drivers/documents" },
  ].filter((i) => i.n > 0) : []
  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined

  const iconBtn = "rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
  const panel = "absolute right-0 top-full z-[60] mt-2 rounded-xl bg-white text-gray-700 shadow-xl ring-1 ring-black/5"

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 bg-[#1A237E] px-3 shadow-md sm:px-4">
      {/* Gauche */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button onClick={toggle} aria-label="Menu" className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow"><span className="text-sm font-bold text-indigo-900">S</span></div>
          {/* Nom masqué sur très petit écran (sinon l'en-tête déborde et la page défile en largeur) */}
          <span className="hidden text-base font-bold tracking-wide text-white min-[400px]:inline md:text-lg" data-no-i18n>SCHOOLMATIK</span>
          <span className="ml-1 hidden rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black uppercase text-indigo-900 lg:inline-block">Admin</span>
        </Link>
        <div className="ml-4 hidden items-center gap-1 border-l border-white/20 pl-4 md:flex">
          <button onClick={() => router.back()} title="Page précédente" className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"><ArrowLeft size={18} /></button>
          <button onClick={toggleFullscreen} title={fullscreen ? "Quitter le plein écran" : "Plein écran"} className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Droite */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-3">
        {/* Alertes */}
        <div className="relative" ref={bellRef}>
          <button onClick={() => { setBellOpen(!bellOpen); if (!bellOpen) loadAlerts() }} title="Alertes" aria-label="Alertes" className={`${iconBtn} relative`}>
            <Bell size={18} />
            {total > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full border border-[#1A237E] bg-red-500 px-1 text-[10px] font-bold text-white">{total > 99 ? "99+" : total}</span>}
          </button>
          {bellOpen && (
            <div className={`${panel} w-80`}>
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold">Alertes</div>
              {items.length === 0 ? <p className="px-4 py-6 text-center text-sm text-gray-400">Rien à traiter pour le moment ✅</p> : (
                <ul className="py-1">
                  {items.map((i) => (
                    <li key={i.href}><Link href={i.href} onClick={() => setBellOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className="grid h-7 min-w-7 place-items-center rounded-full bg-red-50 px-1.5 text-xs font-bold text-red-600">{i.n}</span><span>{i.label}</span>
                    </Link></li>
                  ))}
                </ul>
              )}
              {!!alerts?.latest.length && (
                <div className="border-t border-gray-100 py-1">
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase text-gray-400">Dernières commandes en attente</p>
                  {alerts.latest.map((o) => (
                    <Link key={o.id} href="/orders" onClick={() => setBellOpen(false)} className="flex justify-between px-4 py-1.5 text-xs hover:bg-gray-50">
                      <span className="font-mono text-indigo-600">#{o.orderId}</span>
                      <span>{o.total.toLocaleString("fr-FR")} FCFA</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Langue */}
        <div className="relative" ref={langRef}>
          <button onClick={() => setLangOpen(!langOpen)} aria-label="Langue" className="flex items-center gap-1 rounded px-2 py-1 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white">
            <Globe size={14} /><span className="hidden sm:inline" data-no-i18n>{lang === "en" ? "English" : "Français"}</span><span className="sm:hidden" data-no-i18n>{lang.toUpperCase()}</span><ChevronDown size={12} />
          </button>
          {langOpen && (
            <div className={`${panel} w-40 py-1`} data-no-i18n>
              {([["fr", "🇫🇷 Français"], ["en", "🇬🇧 English"]] as [Lang, string][]).map(([l, label]) => (
                <button key={l} onClick={() => { setLang(l); setLangOpen(false) }} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50">
                  {label}{lang === l && <Check size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserOpen(!userOpen)} aria-label="Mon compte" title={user?.name ?? "Mon compte"}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-green-500 text-xs font-bold text-white shadow-lg">
            <span data-no-i18n>{initials(user?.name)}</span>
          </button>
          {userOpen && (
            <div className={`${panel} w-64`}>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold" data-no-i18n>{user?.name ?? "—"}</p>
                <p className="truncate text-xs text-gray-400" data-no-i18n>{user?.email ?? ""}</p>
                {user?.role && <span className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">{user.role}</span>}
              </div>
              <Link href="/settings/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"><User size={15} /> Mon profil</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><LogOut size={15} /> Déconnexion</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
