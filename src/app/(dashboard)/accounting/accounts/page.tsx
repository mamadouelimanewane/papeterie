"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import AccShell, { btn, card, input } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"

type Account = { code: string; label: string; isActive: boolean; isSystem: boolean; lines: number }
const CLASSES = ["", "Ressources durables", "Actif immobilisé", "Stocks", "Tiers", "Trésorerie", "Charges des activités ordinaires", "Produits des activités ordinaires", "Autres charges et produits (HAO)"]

export default function AccountsPage() {
  const [list, setList] = useState<Account[]>([])
  const [q, setQ] = useState("")
  const [cls, setCls] = useState("")
  const [n, setN] = useState({ code: "", label: "" })
  const { toast } = useFeedback()
  const load = useCallback(() => { adminFetch<Account[]>("/api/admin/accounting/accounts").then(setList).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error")) }, [toast])
  useEffect(() => { load() }, [load])
  const shown = useMemo(() => list.filter((a) => (!cls || a.code.startsWith(cls)) && (!q || a.code.startsWith(q) || a.label.toLowerCase().includes(q.toLowerCase()))), [list, q, cls])

  const add = async () => {
    try { await adminFetch("/api/admin/accounting/accounts", { method: "POST", body: n }); toast(`Compte ${n.code} créé`); setN({ code: "", label: "" }); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }
  const patch = async (a: Account, body: Record<string, unknown>) => {
    try { await adminFetch(`/api/admin/accounting/accounts/${a.code}`, { method: "PATCH", body }); load() } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }
  const rename = async (a: Account) => {
    const label = window.prompt(`Intitulé du compte ${a.code}`, a.label)
    if (label && label !== a.label) patch(a, { label })
  }

  return (
    <AccShell title="Plan comptable SYSCOHADA" printTitle="Plan comptable">
      <div className={`${card} acc-noprint mb-4 flex flex-wrap items-end gap-2 p-3`}>
        <select value={cls} onChange={(e) => setCls(e.target.value)} className={input}><option value="">Toutes les classes</option>{CLASSES.map((c, i) => i > 0 && <option key={i} value={String(i)}>Classe {i} — {c}</option>)}</select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un compte" className={`${input} w-56`} />
        <span className="ml-auto flex items-end gap-2">
          <input value={n.code} onChange={(e) => setN({ ...n, code: e.target.value.replace(/\D/g, "") })} placeholder="N° (ex. 4011001)" className={`${input} w-32`} />
          <input value={n.label} onChange={(e) => setN({ ...n, label: e.target.value })} placeholder="Intitulé" className={`${input} w-56`} />
          <button onClick={add} disabled={!n.code || !n.label} className={btn}>Créer</button>
        </span>
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <tbody>
            {shown.map((a) => (
              <tr key={a.code} className={`border-b border-gray-50 ${a.isActive ? "" : "opacity-50"}`}>
                <td className="w-28 px-3 py-1.5 font-mono text-xs" style={{ paddingLeft: `${(a.code.length - 2) * 8 + 12}px` }}>{a.code}</td>
                <td className={`px-2 ${a.code.length <= 3 ? "font-semibold text-gray-800" : "text-gray-600"}`}>{a.label}{a.isSystem && <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-600">auto</span>}</td>
                <td className="px-2 text-right text-xs text-gray-400">{a.lines ? `${a.lines} ligne(s)` : ""}</td>
                <td className="acc-noprint whitespace-nowrap px-3 text-right text-xs">
                  <button onClick={() => rename(a)} className="text-gray-500 hover:underline">Renommer</button>
                  {!a.isSystem && <button onClick={() => patch(a, { isActive: !a.isActive })} className="ml-2 text-gray-500 hover:underline">{a.isActive ? "Désactiver" : "Activer"}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccShell>
  )
}
