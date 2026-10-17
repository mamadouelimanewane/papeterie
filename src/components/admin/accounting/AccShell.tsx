"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Printer } from "lucide-react"

/** Onglets de la comptabilité. */
const TABS = [
  { href: "/accounting", label: "Tableau de bord" },
  { href: "/accounting/entries", label: "Écritures" },
  { href: "/accounting/expenses", label: "Achats & charges" },
  { href: "/accounting/ledger", label: "Grand livre" },
  { href: "/accounting/balance", label: "Balance" },
  { href: "/accounting/statements", label: "États financiers" },
  { href: "/accounting/vat", label: "TVA" },
  { href: "/accounting/assets", label: "Immobilisations" },
  { href: "/accounting/accounts", label: "Plan comptable" },
  { href: "/accounting/closing", label: "Clôture" },
  { href: "/accounting/settings", label: "Réglages" },
]

const KEY = "acc-year"
const thisYear = () => new Date().getFullYear()

/** Exercice affiché, mémorisé dans le navigateur (commun à tous les écrans comptables). */
export function useYear() {
  const [year, setYear] = useState(thisYear())
  useEffect(() => {
    let y = 0
    try { y = Number(localStorage.getItem(KEY)) } catch { /* stockage indisponible : exercice en cours */ }
    // Lu après l'affichage (le rendu serveur ne connaît pas le navigateur)
    const t = setTimeout(() => { if (y > 2000 && y !== thisYear()) setYear(y) })
    return () => clearTimeout(t)
  }, [])
  const change = (y: number) => { setYear(y); try { localStorage.setItem(KEY, String(y)) } catch { /* idem */ } }
  return [year, change] as const
}

export const fcfa = (n: number | null | undefined) => (n ? Math.round(n).toLocaleString("fr-FR") : "")
export const fcfaZ = (n: number | null | undefined) => Math.round(n ?? 0).toLocaleString("fr-FR")
export const dateFr = (d: string | Date) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "UTC" })

/** Cadre commun : titre, onglets, choix de l'exercice, impression. `printTitle` : en-tête des états imprimés. */
export default function AccShell({ title, year, onYear, years, actions, children, printTitle, company }: {
  title: string
  year?: number
  onYear?: (y: number) => void
  years?: number[]
  actions?: React.ReactNode
  children: React.ReactNode
  printTitle?: string
  company?: { name?: string; ninea?: string; rccm?: string; address?: string; city?: string } | null
}) {
  const path = usePathname()
  const list = years?.length ? years : [thisYear() + 1, thisYear(), thisYear() - 1, thisYear() - 2]
  return (
    <div className="acc-shell">
      <style>{`@media print{aside,header,nav.acc-tabs,.acc-noprint{display:none!important}main{padding:0!important;margin:0!important}.acc-shell{font-size:11px}.acc-print{display:block!important}table{page-break-inside:auto}tr{page-break-inside:avoid}}`}</style>
      <div className="acc-noprint mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-800">🧮 {title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {year !== undefined && onYear && (
            <select value={year} onChange={(e) => onYear(Number(e.target.value))} aria-label="Exercice" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {[...new Set([...list, year])].sort((a, b) => b - a).map((y) => <option key={y} value={y}>Exercice {y}</option>)}
            </select>
          )}
          {printTitle && (
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Printer size={14} /> Imprimer / PDF</button>
          )}
        </div>
      </div>
      <nav className="acc-tabs acc-noprint mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold ${path === t.href ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-800"}`}>{t.label}</Link>
        ))}
      </nav>
      {printTitle && (
        <div className="acc-print mb-4 hidden">
          <div className="flex justify-between text-xs">
            <div><b>{company?.name}</b><br />{company?.address} {company?.city}<br />{company?.ninea ? `NINEA : ${company.ninea}` : ""} {company?.rccm ? `· RCCM : ${company.rccm}` : ""}</div>
            <div className="text-right">Imprimé le {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
          <h2 className="mt-3 text-center text-base font-bold uppercase">{printTitle}</h2>
          <div className="text-center text-xs">Système comptable OHADA (SYSCOHADA révisé) — montants en francs CFA</div>
        </div>
      )}
      {children}
    </div>
  )
}

export const card = "rounded-xl border border-gray-100 bg-white shadow-sm"
export const input = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
export const btn = "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
export const btn2 = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
