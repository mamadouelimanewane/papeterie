"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Download } from "lucide-react"
import AccShell, { btn2, card, fcfa, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Row = { account: string; label: string; openDebit: number; openCredit: number; moveDebit: number; moveCredit: number; endDebit: number; endCredit: number }
type Data = { rows: Row[]; totals: Omit<Row, "account" | "label">; company: Record<string, string> }
const CLASSES: Record<string, string> = { "1": "Ressources durables", "2": "Actif immobilisé", "3": "Stocks", "4": "Tiers", "5": "Trésorerie", "6": "Charges des activités ordinaires", "7": "Produits des activités ordinaires", "8": "Autres charges et produits" }

export default function BalancePage() {
  const [year, setYear] = useYear()
  const [from, setFrom] = useState(""), [to, setTo] = useState("")
  const [level, setLevel] = useState<"detail" | "class">("detail")
  const [d, setD] = useState<Data | null>(null)
  const { toast } = useFeedback()
  const load = useCallback(() => {
    const qs = new URLSearchParams({ type: "balance", year: String(year), ...(from ? { from } : {}), ...(to ? { to } : {}) })
    adminFetch<Data>(`/api/admin/accounting/reports?${qs}`).then(setD).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [year, from, to, toast])
  useEffect(() => { load() }, [load])

  const keys = ["openDebit", "openCredit", "moveDebit", "moveCredit", "endDebit", "endCredit"] as const
  const byClass = d ? Object.entries(CLASSES).map(([c, label]) => {
    const rs = d.rows.filter((r) => r.account.startsWith(c))
    return { account: `Classe ${c}`, label, ...Object.fromEntries(keys.map((k) => [k, rs.reduce((s, r) => s + r[k], 0)])) } as Row
  }).filter((r) => keys.some((k) => r[k])) : []
  const rows = level === "class" ? byClass : d?.rows ?? []
  const ok = d && d.totals.moveDebit === d.totals.moveCredit && d.totals.endDebit === d.totals.endCredit

  return (
    <AccShell title="Balance générale" year={year} onYear={setYear} printTitle={`Balance générale — exercice ${year}${from || to ? ` (du ${from || "début"} au ${to || "fin"})` : ""}`} company={d?.company}
      actions={<a href={`/api/admin/accounting/export?type=balance&year=${year}`} className={`${btn2} flex items-center gap-1.5`}><Download size={14} /> Export CSV</a>}>
      <div className={`${card} acc-noprint mb-4 flex flex-wrap items-end gap-2 p-3`}>
        <label className="text-xs text-gray-500">Du<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${input} ml-1`} /></label>
        <label className="text-xs text-gray-500">au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${input} ml-1`} /></label>
        <select value={level} onChange={(e) => setLevel(e.target.value as "detail" | "class")} className={input}><option value="detail">Par compte</option><option value="class">Par classe</option></select>
        {d && <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{ok ? "Balance équilibrée" : "Balance déséquilibrée"}</span>}
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs">
          <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <tr><th rowSpan={2} className="px-3 py-2 text-left">Compte</th><th rowSpan={2} className="px-2 text-left">Intitulé</th><th colSpan={2} className="px-2 pt-2">Soldes d&apos;ouverture</th><th colSpan={2} className="px-2 pt-2">Mouvements de la période</th><th colSpan={2} className="px-2 pt-2">Soldes de clôture</th></tr>
            <tr>{["Débit", "Crédit", "Débit", "Crédit", "Débit", "Crédit"].map((h, i) => <th key={i} className="px-2 pb-2 text-right">{h}</th>)}</tr>
          </thead>
          <tbody>
            {!d && <tr><td colSpan={8} className="py-8 text-center text-gray-400">Chargement…</td></tr>}
            {rows.map((r) => (
              <tr key={r.account} className="border-b border-gray-50">
                <td className="px-3 py-1.5 font-mono">{level === "detail" ? <Link href={`/accounting/ledger?account=${r.account}`} className="text-brand-700 hover:underline">{r.account}</Link> : r.account}</td>
                <td className="px-2 text-gray-600">{r.label}</td>
                {keys.map((k) => <td key={k} className="px-2 text-right">{fcfa(r[k])}</td>)}
              </tr>
            ))}
          </tbody>
          {d && (
            <tfoot className="border-t-2 border-gray-300 font-bold">
              <tr><td className="px-3 py-2" colSpan={2}>TOTAUX</td>{keys.map((k) => <td key={k} className="px-2 text-right">{fcfaZ(d.totals[k])}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </div>
    </AccShell>
  )
}
