"use client"

import { useCallback, useEffect, useState } from "react"
import { Download } from "lucide-react"
import SecurityTabs from "@/components/admin/SecurityTabs"
import { adminFetch } from "@/lib/adminApi"
import { AUDIT_LABELS } from "@/lib/security/auditLabels"

type Log = { id: string; at: string; actorEmail: string | null; action: string; target: string | null; details: Record<string, unknown> | null; ip: string | null; outcome: string }
const GROUPS: [string, string][] = [["", "Toutes les actions"], ["login", "Connexions"], ["password", "Mots de passe"], ["2fa", "Double authentification"], ["admin", "Administrateurs"], ["role", "Rôles"], ["settings", "Paramètres"], ["product", "Produits"], ["order", "Commandes"], ["wallet", "Portefeuilles"], ["cashout", "Retraits"], ["accounting", "Comptabilité"], ["backup", "Sauvegardes"], ["security", "Sécurité"]]
const input = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"

export default function AuditPage() {
  const [f, setF] = useState({ action: "", actor: "", outcome: "", from: "", to: "", q: "" })
  const [page, setPage] = useState(1)
  const [d, setD] = useState<{ logs: Log[]; total: number; pages: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("action")
    const t = setTimeout(() => { if (a) setF((x) => ({ ...x, action: a })) })
    return () => clearTimeout(t)
  }, [])
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)))
  const load = useCallback(() => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)))
    q.set("page", String(page))
    adminFetch<{ logs: Log[]; total: number; pages: number }>(`/api/admin/audit?${q}`).then(setD).catch((e) => setErr(e instanceof Error ? e.message : "Erreur"))
  }, [f, page])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setPage(1) }

  return (
    <div>
      <SecurityTabs title="Journal d'audit" actions={<a href={`/api/admin/audit?${qs}&format=csv`} className={`${input} flex items-center gap-1.5 text-gray-700 hover:bg-gray-50`}><Download size={14} /> Export CSV</a>} />
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <select value={f.action} onChange={(e) => set("action", e.target.value)} className={input}>{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={f.outcome} onChange={(e) => set("outcome", e.target.value)} className={input}><option value="">Tous les résultats</option><option value="ok">Réussies</option><option value="refusé">Refusées</option><option value="échec">En échec</option></select>
        <input value={f.actor} onChange={(e) => set("actor", e.target.value)} placeholder="Par (e-mail)" className={`${input} w-44`} />
        <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Élément, adresse IP…" className={`${input} w-44`} />
        <label className="text-xs text-gray-500">Du<input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} className={`${input} ml-1`} /></label>
        <label className="text-xs text-gray-500">au<input type="date" value={f.to} onChange={(e) => set("to", e.target.value)} className={`${input} ml-1`} /></label>
        <span className="ml-auto text-xs text-gray-400">{d?.total ?? 0} événement(s)</span>
      </div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-3 py-2">Date</th><th className="px-2">Action</th><th className="px-2">Par</th><th className="px-2">Élément</th><th className="px-2">Détails</th><th className="px-3">Adresse IP</th></tr>
          </thead>
          <tbody>
            {d?.logs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun événement.</td></tr>}
            {d?.logs.map((l) => (
              <tr key={l.id} className="border-b border-gray-50 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{new Date(l.at).toLocaleString("fr-FR")}</td>
                <td className="px-2 py-2">
                  <span className={`mr-1 inline-block h-2 w-2 rounded-full ${l.outcome === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-gray-800">{AUDIT_LABELS[l.action] ?? l.action}</span>
                </td>
                <td className="px-2 py-2 text-xs text-gray-600" data-no-i18n>{l.actorEmail ?? "—"}</td>
                <td className="px-2 py-2 text-xs text-gray-600" data-no-i18n>{l.target ?? ""}</td>
                <td className="max-w-xs px-2 py-2 text-[11px] text-gray-500" data-no-i18n>{l.details ? Object.entries(l.details).map(([k, v]) => `${k} : ${typeof v === "string" ? v : JSON.stringify(v)}`).join(" · ") : ""}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-gray-400">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d && d.pages > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={`${input} disabled:opacity-50`}>← Précédent</button>
          <span className="px-2 py-2 text-xs text-gray-500">Page {page} / {d.pages}</span>
          <button disabled={page >= d.pages} onClick={() => setPage(page + 1)} className={`${input} disabled:opacity-50`}>Suivant →</button>
        </div>
      )}
    </div>
  )
}
