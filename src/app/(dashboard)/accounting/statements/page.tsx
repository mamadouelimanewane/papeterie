"use client"

import { useCallback, useEffect, useState } from "react"
import AccShell, { card, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type L = { ref: string; label: string; amount: number; total?: boolean }
type Bilan = { assets: L[]; liabilities: L[]; totalAssets: number; totalLiabilities: number; balanced: boolean; provisional: boolean; unmapped: string[]; company: Record<string, string> }
type Income = { lines: L[]; result: number; unmapped: string[]; company: Record<string, string> }

function Table({ title, lines, sign }: { title: string; lines: L[]; sign?: boolean }) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">{title}</div>
      <table className="w-full text-xs">
        <thead className="text-left text-gray-400"><tr><th className="w-12 px-3 py-1">Réf.</th><th className="px-2">Libellé</th><th className="px-3 text-right">Montant net</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.ref} className={l.total ? "border-y border-gray-200 bg-gray-50 font-bold text-gray-800" : "border-b border-gray-50 text-gray-600"}>
              <td className="px-3 py-1.5 font-mono">{l.ref}</td>
              <td className="px-2">{l.label}</td>
              <td className={`px-3 text-right ${sign && l.total && l.amount < 0 ? "text-red-600" : ""}`}>{l.amount ? fcfaZ(l.amount) : l.total ? "0" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function StatementsPage() {
  const [year, setYear] = useYear()
  const [tab, setTab] = useState<"bilan" | "income">("bilan")
  const [to, setTo] = useState("")
  const [bilan, setBilan] = useState<Bilan | null>(null)
  const [income, setIncome] = useState<Income | null>(null)
  const { toast } = useFeedback()
  const load = useCallback(() => {
    const q = `year=${year}${to ? `&to=${to}` : ""}`
    adminFetch<Bilan>(`/api/admin/accounting/reports?type=bilan&${q}`).then(setBilan).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
    adminFetch<Income>(`/api/admin/accounting/reports?type=income&${q}`).then(setIncome).catch(() => {})
  }, [year, to, toast])
  useEffect(() => { load() }, [load])
  const unmapped = [...new Set([...(bilan?.unmapped ?? []), ...(income?.unmapped ?? [])])]

  return (
    <AccShell title="États financiers" year={year} onYear={setYear} company={bilan?.company}
      printTitle={tab === "bilan" ? `Bilan au ${to ? new Date(to).toLocaleDateString("fr-FR") : `31/12/${year}`}` : `Compte de résultat — exercice ${year}`}>
      <div className="acc-noprint mb-4 flex flex-wrap items-center gap-2">
        {(["bilan", "income"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{t === "bilan" ? "Bilan" : "Compte de résultat"}</button>
        ))}
        <label className="ml-2 text-xs text-gray-500">Arrêté au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${input} ml-1`} /></label>
        {bilan?.provisional && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Provisoire : exercice non clôturé</span>}
      </div>
      {unmapped.length > 0 && <p className="acc-noprint mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Comptes non classés dans les rubriques : {unmapped.join(", ")} (vérifiez leur numéro).</p>}
      {tab === "bilan" ? (
        !bilan ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Table title="ACTIF" lines={bilan.assets} />
              <Table title="PASSIF" lines={bilan.liabilities} sign />
            </div>
            <p className={`mt-3 text-center text-xs font-semibold ${bilan.balanced ? "text-emerald-600" : "text-red-600"}`}>
              Total actif {fcfaZ(bilan.totalAssets)} — total passif {fcfaZ(bilan.totalLiabilities)} : {bilan.balanced ? "bilan équilibré" : "écart à analyser"}
            </p>
          </>
        )
      ) : (
        !income ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
          <div className="mx-auto max-w-3xl"><Table title="COMPTE DE RÉSULTAT" lines={income.lines} sign /></div>
        )
      )}
      <p className="mt-4 text-[11px] text-gray-400">Présentation du système normal SYSCOHADA révisé (rubriques AD à BZ, CA à DZ, TA à XI), montants nets. Les états annuels officiels (DSF) et leurs notes annexes sont établis par l&apos;expert-comptable à partir de ces états et de la balance.</p>
    </AccShell>
  )
}
