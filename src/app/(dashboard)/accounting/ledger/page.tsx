"use client"

import { useCallback, useEffect, useState } from "react"
import AccShell, { card, dateFr, fcfa, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Move = { entryId: string; number: string; journal: string; date: string; label: string; reference: string | null; thirdParty: string | null; debit: number; credit: number; balance: number }
type Acc = { account: string; label: string; opening: number; moves: Move[]; totalDebit: number; totalCredit: number; closing: number }
type Company = { name?: string; ninea?: string; rccm?: string; address?: string; city?: string }

const solde = (n: number) => (n === 0 ? "0" : `${fcfaZ(Math.abs(n))} ${n > 0 ? "D" : "C"}`)

export default function LedgerPage() {
  const [year, setYear] = useYear()
  const [account, setAccount] = useState("")
  const [from, setFrom] = useState(""), [to, setTo] = useState("")
  const [data, setData] = useState<{ accounts: Acc[]; company: Company } | null>(null)
  const [accounts, setAccounts] = useState<{ code: string; label: string }[]>([])
  const { toast } = useFeedback()

  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("account")
    const t = setTimeout(() => { if (a) setAccount(a) }) // lien depuis la balance ou le tableau de bord : ?account=411
    adminFetch<{ code: string; label: string }[]>("/api/admin/accounting/accounts").then(setAccounts).catch(() => {})
    return () => clearTimeout(t)
  }, [])
  const load = useCallback(() => {
    const qs = new URLSearchParams({ type: "ledger", year: String(year), account, ...(from ? { from } : {}), ...(to ? { to } : {}) })
    adminFetch<{ accounts: Acc[]; company: Company }>(`/api/admin/accounting/reports?${qs}`).then(setData).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [year, account, from, to, toast])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  return (
    <AccShell title="Grand livre" year={year} onYear={setYear} printTitle={`Grand livre ${account ? `— comptes ${account}…` : ""} — exercice ${year}`} company={data?.company}>
      <datalist id="acc-accounts">{accounts.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}</datalist>
      <div className={`${card} acc-noprint mb-4 flex flex-wrap items-end gap-2 p-3`}>
        <input value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))} list="acc-accounts" placeholder="Compte ou racine (vide : tous)" className={`${input} w-56`} />
        <label className="text-xs text-gray-500">Du<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${input} ml-1`} /></label>
        <label className="text-xs text-gray-500">au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${input} ml-1`} /></label>
        <span className="text-xs text-gray-400">Exemples : 411 clients, 4012 livreurs, 5 trésorerie, 7 produits.</span>
      </div>
      {!data ? <div className="h-32 animate-pulse rounded-xl bg-gray-50" /> : data.accounts.length === 0 ? <p className="py-10 text-center text-sm text-gray-400">Aucun mouvement.</p> : (
        <div className="space-y-4">
          {data.accounts.map((a) => (
            <div key={a.account} className={`${card} overflow-x-auto`}>
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm">
                <span className="font-semibold text-gray-800"><span className="font-mono">{a.account}</span> — {a.label}</span>
                <span className="text-xs text-gray-500">Solde final : <b>{solde(a.closing)}</b></span>
              </div>
              <table className="w-full text-xs">
                <thead className="text-left text-gray-400"><tr><th className="px-3 py-1">Date</th><th className="px-2">Jal</th><th className="px-2">N°</th><th className="px-2">Libellé</th><th className="px-2">Pièce</th><th className="px-2 text-right">Débit</th><th className="px-2 text-right">Crédit</th><th className="px-3 text-right">Solde</th></tr></thead>
                <tbody>
                  {a.opening !== 0 && <tr className="text-gray-500"><td className="px-3 py-1" colSpan={5}>Solde d&apos;ouverture (à-nouveaux et période antérieure)</td><td className="px-2 text-right">{a.opening > 0 ? fcfaZ(a.opening) : ""}</td><td className="px-2 text-right">{a.opening < 0 ? fcfaZ(-a.opening) : ""}</td><td className="px-3 text-right">{solde(a.opening)}</td></tr>}
                  {a.moves.map((m, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-1 text-gray-500">{dateFr(m.date)}</td><td className="px-2">{m.journal}</td><td className="px-2 font-mono text-gray-400">{m.number}</td>
                      <td className="px-2 text-gray-700">{m.label}{m.thirdParty ? ` · ${m.thirdParty}` : ""}</td><td className="px-2 text-gray-400">{m.reference}</td>
                      <td className="px-2 text-right">{fcfa(m.debit)}</td><td className="px-2 text-right">{fcfa(m.credit)}</td><td className="px-3 text-right text-gray-600">{solde(m.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 font-semibold"><td className="px-3 py-1" colSpan={5}>Total des mouvements</td><td className="px-2 text-right">{fcfaZ(a.totalDebit)}</td><td className="px-2 text-right">{fcfaZ(a.totalCredit)}</td><td className="px-3 text-right">{solde(a.closing)}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </AccShell>
  )
}
