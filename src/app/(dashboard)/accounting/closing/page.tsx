"use client"

import { useCallback, useEffect, useState } from "react"
import AccShell, { btn, btn2, card, dateFr, fcfaZ } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Year = { year: number; status: string; closedAt: string | null; result: number | null; entries: number }
type Next = { year: number; status: string; result: number; balanced: boolean; pendingDepreciation: number; previousOpen: number | null; depreciation: { label: string; amount: number }[] }

export default function ClosingPage() {
  const [d, setD] = useState<{ years: Year[]; next: Next | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast, confirm } = useFeedback()
  const load = useCallback(() => { adminFetch<{ years: Year[]; next: Next | null }>("/api/admin/accounting/years").then(setD).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error")) }, [toast])
  useEffect(() => { load() }, [load])

  const act = async (year: number, action: string, ok: string) => {
    setBusy(true)
    try { await adminFetch(`/api/admin/accounting/years/${year}`, { method: "POST", body: { action } }); toast(ok); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setBusy(false) }
  }
  const close = async (n: Next) => {
    if (!(await confirm({ title: `Clôturer l'exercice ${n.year} ?`, message: `Résultat : ${fcfaZ(n.result)} FCFA. L'exercice sera verrouillé (plus aucune écriture) et les soldes des comptes de bilan reportés en à-nouveaux au 01/01/${n.year + 1}, le résultat en 130 (en instance d'affectation).`, confirmLabel: "Clôturer", danger: true }))) return
    act(n.year, "close", `Exercice ${n.year} clôturé`)
  }
  const reopen = async (y: Year) => {
    if (!(await confirm({ title: `Rouvrir l'exercice ${y.year} ?`, message: "Les à-nouveaux générés seront supprimés ; refaites la clôture après correction.", confirmLabel: "Rouvrir", danger: true }))) return
    act(y.year, "reopen", `Exercice ${y.year} rouvert`)
  }

  const n = d?.next
  return (
    <AccShell title="Clôture d'exercice">
      {!d ? <div className="h-40 animate-pulse rounded-xl bg-gray-50" /> : (
        <div className="space-y-5">
          {n && (
            <div className={`${card} space-y-3 p-5`}>
              <div className="text-sm font-semibold text-gray-700">Prochaine clôture : exercice {n.year}</div>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className={n.balanced ? "text-emerald-600" : "text-red-600"}>{n.balanced ? "✓" : "✗"}</span> Balance équilibrée</li>
                <li className="flex flex-wrap items-center gap-2">
                  <span className={n.pendingDepreciation ? "text-amber-600" : "text-emerald-600"}>{n.pendingDepreciation ? "!" : "✓"}</span>
                  Dotations aux amortissements {n.pendingDepreciation ? `à passer : ${n.depreciation.map((x) => `${x.label} (${fcfaZ(x.amount)})`).join(", ")}` : "passées (ou aucune immobilisation)"}
                  {n.pendingDepreciation > 0 && <button disabled={busy} onClick={() => act(n.year, "depreciation", "Dotations passées")} className={btn2}>Passer les dotations</button>}
                </li>
                <li className="text-gray-600">• Inventaire : passez la variation de stock (débit 311 / crédit 6031 si le stock augmente, l&apos;inverse sinon) et les régularisations (charges à payer, produits constatés d&apos;avance) dans Écritures.</li>
                <li className="text-gray-600">• Liquidez la TVA de décembre et l&apos;impôt sur le résultat (891 / 441) si besoin.</li>
                {n.previousOpen && <li className="text-red-600">✗ L&apos;exercice {n.previousOpen} doit être clôturé d&apos;abord.</li>}
              </ol>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm">Résultat de l&apos;exercice : <b className={n.result >= 0 ? "text-emerald-600" : "text-red-600"}>{fcfaZ(n.result)} FCFA</b> ({n.result >= 0 ? "bénéfice" : "perte"})</span>
                <button disabled={busy || !n.balanced || !!n.previousOpen} onClick={() => close(n)} className={btn}>Clôturer l&apos;exercice {n.year}</button>
              </div>
            </div>
          )}
          <div className={card}>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-2">Exercice</th><th className="px-2">Statut</th><th className="px-2 text-right">Écritures</th><th className="px-2 text-right">Résultat</th><th className="px-2">Clôturé le</th><th className="px-4"></th></tr></thead>
              <tbody>
                {d.years.map((y) => (
                  <tr key={y.year} className="border-b border-gray-50">
                    <td className="px-4 py-2 font-semibold">{y.year}</td>
                    <td className="px-2"><span className={`rounded-full px-2 py-0.5 text-xs ${y.status === "Ouvert" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{y.status}</span></td>
                    <td className="px-2 text-right">{y.entries}</td>
                    <td className="px-2 text-right">{y.result === null ? "—" : fcfaZ(y.result)}</td>
                    <td className="px-2 text-xs text-gray-500">{y.closedAt ? dateFr(y.closedAt) : ""}</td>
                    <td className="px-4 text-right">{y.status !== "Ouvert" && <button disabled={busy} onClick={() => reopen(y)} className="text-xs text-gray-500 hover:underline">Rouvrir</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400">L&apos;affectation du résultat décidée par l&apos;assemblée (réserve légale, report à nouveau, dividendes) se passe ensuite au journal OD de l&apos;exercice suivant : débit 1301, crédit 111 / 1211 / 465.</p>
        </div>
      )}
    </AccShell>
  )
}
