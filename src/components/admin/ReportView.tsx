"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, RefreshCw, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { adminFetch, exportCsv } from "@/lib/adminApi"
import type { Column } from "./CrudPage"

type Row = { id: string; [k: string]: unknown }
export type ReportData = { rows: Row[]; monthly?: { month: string; earning: number }[]; totals?: Record<string, number>; [k: string]: unknown }
type Kpi = { label: string; value: string | number; color?: string }

type Props = {
  title: string
  icon?: React.ReactNode
  kind: string
  params?: Record<string, string>
  columns: Column[]
  kpis?: (rows: Row[], data: ReportData) => Kpi[]
  chartTitle?: string
  exportName: string
  searchPlaceholder?: string
  extraFilters?: (rows: Row[], set: (f: (r: Row) => boolean) => void) => React.ReactNode
  actions?: React.ReactNode
  reloadKey?: number
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
const monthLabel = (m: string) => { const [y, mm] = m.split("-"); return `${MONTHS[Number(mm) - 1]} ${y.slice(2)}` }

export default function ReportView({ title, icon, kind, params, columns, kpis, chartTitle, exportName, searchPlaceholder = "Rechercher...", extraFilters, actions, reloadKey }: Props) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [applied, setApplied] = useState({ from: "", to: "" })
  const [q, setQ] = useState("")
  const [extra, setExtra] = useState<(r: Row) => boolean>(() => () => true)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const sp = new URLSearchParams({ ...(params ?? {}), ...(applied.from ? { from: applied.from } : {}), ...(applied.to ? { to: applied.to } : {}) })
    try { setData(await adminFetch<ReportData>(`/api/admin/reports/${kind}?${sp}`)) }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, applied, JSON.stringify(params)])
  useEffect(() => { load() }, [load, reloadKey])

  const rows = useMemo(() => {
    const all = data?.rows ?? []
    const s = q.trim().toLowerCase()
    return all.filter(extra).filter((r) => !s || Object.values(r).some((v) => v !== null && typeof v !== "object" && String(v).toLowerCase().includes(s)))
  }, [data, q, extra])

  const reset = () => { setFrom(""); setTo(""); setApplied({ from: "", to: "" }); setQ(""); setExtra(() => () => true) }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">{icon} {title}</h1>
        <div className="flex gap-2">
          {actions}
          <button disabled={!rows.length}
            onClick={() => { const cols = columns.filter((c) => c.key !== "_actions"); exportCsv(exportName, cols, rows.map((r) => Object.fromEntries(cols.map((c) => [c.key, c.csv ? c.csv(r) : r[c.key]])))) }}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50">
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      {kpis && data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis(rows, data).map((k) => (
            <div key={k.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`mb-3 h-8 w-2 rounded-full ${k.color ?? "bg-indigo-500"}`} />
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {chartTitle && data?.monthly && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-700">{chartTitle}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} FCFA`, "Montant"]} />
              <Bar dataKey="earning" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-xs text-gray-500">Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="mb-1 block text-xs text-gray-500">Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          {extraFilters?.(data?.rows ?? [], (f) => setExtra(() => f))}
          <div className="relative"><label className="mb-1 block text-xs text-gray-500">Recherche</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <button onClick={() => setApplied({ from, to })} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"><Search size={14} /> Filtrer</button>
          <button onClick={reset} title="Réinitialiser" className="rounded-lg bg-gray-100 p-2.5 text-gray-600 hover:bg-gray-200"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">N°</th>
              {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {error ? <tr><td colSpan={columns.length + 1} className="py-10 text-center text-sm text-red-500">{error} — <button onClick={load} className="underline">Réessayer</button></td></tr>
              : loading && !data ? <tr><td colSpan={columns.length + 1} className="p-4"><div className="h-4 animate-pulse rounded bg-gray-100" /></td></tr>
              : !rows.length ? <tr><td colSpan={columns.length + 1} className="py-10 text-center text-sm text-gray-400">Aucune donnée sur cette période</td></tr>
              : rows.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  {columns.map((c) => <td key={c.key} className={c.className ?? "px-4 py-3 text-gray-700"}>{c.render ? c.render(r) : String(r[c.key] ?? "—")}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
        <div className="border-t p-3 text-xs text-gray-400">Affichage de {rows.length} sur {data?.rows.length ?? 0} entrées</div>
      </div>
    </div>
  )
}
