"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import AccShell, { btn2, card, dateFr, fcfaZ, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Summary = {
  year: number; status: string; years: { year: number }[]
  revenue: number; result: number; margin: number; treasury: number; clients: number; suppliers: number; vatMonth: number; balanced: boolean
  sync: { created: number; errors: string[]; manual: { date: string; label: string; amount: number }[] }
  last: { id: string; number: string; journal: string; date: string; label: string; amount: number; auto: boolean }[]
}

export default function AccountingHome() {
  const [year, setYear] = useYear()
  const [d, setD] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useFeedback()

  const load = useCallback(() => {
    adminFetch<Summary>(`/api/admin/accounting?year=${year}`).then(setD).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [year, toast])
  useEffect(() => { load() }, [load])

  const sync = async () => {
    setBusy(true)
    try {
      const r = await adminFetch<{ created: number; errors: string[] }>("/api/admin/accounting/sync", { method: "POST" })
      toast(r.created ? `${r.created} écriture(s) automatique(s) passée(s)` : "Tout est déjà comptabilisé", r.errors.length ? "error" : "success")
      load()
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }

  const kpi = (label: string, value: number, color: string, href?: string, hint?: string) => {
    const body = (
      <div className={`${card} p-4`}>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`mt-1 text-xl font-bold ${color}`}>{fcfaZ(value)} <span className="text-xs font-normal text-gray-400">FCFA</span></div>
        {hint && <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>}
      </div>
    )
    return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body
  }

  return (
    <AccShell title="Comptabilité" year={year} onYear={setYear} years={d?.years.map((y) => y.year)}
      actions={<button onClick={sync} disabled={busy} className={`${btn2} flex items-center gap-1.5`}><RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Comptabiliser les opérations</button>}>
      {!d ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${d.status === "Ouvert" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>Exercice {d.year} : {d.status.toLowerCase()}</span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ${d.balanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{d.balanced ? "Bilan équilibré" : "Bilan déséquilibré"}</span>
            <span className="text-gray-400">SYSCOHADA révisé · les ventes, encaissements, frais de livreurs, retraits et remboursements sont comptabilisés automatiquement.</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi("Chiffre d'affaires HT (XB)", d.revenue, "text-gray-800", "/accounting/statements")}
            {kpi("Marge commerciale (XA)", d.margin, "text-gray-800", "/accounting/statements", "Ventes − achats de marchandises")}
            {kpi("Résultat net (XI)", d.result, d.result >= 0 ? "text-emerald-600" : "text-red-600", "/accounting/statements", d.status === "Ouvert" ? "Provisoire" : "Définitif")}
            {kpi("Trésorerie", d.treasury, "text-blue-700", "/accounting/ledger?account=5")}
            {kpi("Créances clients", d.clients, "text-gray-800", "/accounting/ledger?account=411")}
            {kpi("Dettes fournisseurs et livreurs", d.suppliers, "text-gray-800", "/accounting/ledger?account=401")}
            {kpi("TVA nette du mois", d.vatMonth, d.vatMonth > 0 ? "text-amber-600" : "text-gray-800", "/accounting/vat", d.vatMonth > 0 ? "À reverser" : "Crédit ou néant")}
          </div>

          {(d.sync.errors.length > 0 || d.sync.manual.length > 0) && (
            <div className={`${card} p-4`}>
              <div className="mb-2 text-sm font-semibold text-amber-700">À traiter par le comptable</div>
              {d.sync.errors.map((e, i) => <p key={i} className="text-xs text-red-600">⚠ {e}</p>)}
              {d.sync.manual.length > 0 && (
                <>
                  <p className="mb-1 text-xs text-gray-600">Mouvements manuels de portefeuille (crédits / débits saisis dans le back-office) : leur nature n&apos;est pas connue, passez l&apos;écriture adaptée dans <Link href="/accounting/entries" className="text-brand-700 underline">Écritures</Link>.</p>
                  <ul className="text-xs text-gray-500">{d.sync.manual.slice(0, 10).map((m, i) => <li key={i}>{dateFr(m.date)} · {m.label} · {fcfaZ(m.amount)} FCFA</li>)}</ul>
                </>
              )}
            </div>
          )}

          <div className={card}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">Dernières écritures</span>
              <Link href="/accounting/entries" className="text-xs text-brand-700 hover:underline">Toutes les écritures →</Link>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {d.last.length === 0 && <tr><td className="px-4 py-6 text-center text-gray-400">Aucune écriture sur cet exercice.</td></tr>}
                {d.last.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{e.number}</td>
                    <td className="px-2 py-2 text-xs text-gray-500">{dateFr(e.date)}</td>
                    <td className="px-2 py-2 text-gray-700">{e.label}</td>
                    <td className="px-2 py-2 text-right font-semibold text-gray-700">{fcfaZ(e.amount)}</td>
                    <td className="px-4 py-2 text-right text-[11px] text-gray-400">{e.auto ? "auto" : "saisie"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AccShell>
  )
}
