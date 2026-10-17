"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Plus, Trash2, Undo2 } from "lucide-react"
import AccShell, { btn, btn2, card, dateFr, fcfa, fcfaZ, input, useYear } from "@/components/admin/accounting/AccShell"
import { adminFetch } from "@/lib/adminApi"
import { useFeedback } from "@/components/admin/Feedback"
import { JOURNALS } from "@/lib/accounting/chart"

type Line = { id: string; account: string; label: string | null; thirdParty: string | null; debit: number; credit: number }
type Entry = { id: string; number: string; journal: string; date: string; label: string; reference: string | null; sourceType: string | null; createdBy: string | null; lines: Line[] }
type Account = { code: string; label: string; isActive: boolean }
type Draft = { journal: string; date: string; label: string; reference: string; lines: { account: string; label: string; thirdParty: string; debit: string; credit: string }[] }

const today = () => new Date().toISOString().slice(0, 10)
const emptyLine = () => ({ account: "", label: "", thirdParty: "", debit: "", credit: "" })

export default function EntriesPage() {
  const [year, setYear] = useYear()
  const [f, setF] = useState({ journal: "", from: "", to: "", q: "", account: "", origin: "" })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ entries: Entry[]; total: number; pages: number } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast, confirm } = useFeedback()

  const load = useCallback(() => {
    const qs = new URLSearchParams({ year: String(year), page: String(page), ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) })
    adminFetch<{ entries: Entry[]; total: number; pages: number }>(`/api/admin/accounting/entries?${qs}`).then(setData).catch((e) => toast(e instanceof Error ? e.message : "Erreur", "error"))
  }, [year, page, f, toast])
  useEffect(() => { load() }, [load])
  useEffect(() => { adminFetch<Account[]>("/api/admin/accounting/accounts").then(setAccounts).catch(() => {}) }, [])
  const label = useMemo(() => new Map(accounts.map((a) => [a.code, a.label])), [accounts])

  const totals = draft ? draft.lines.reduce((s, l) => ({ d: s.d + (Number(l.debit) || 0), c: s.c + (Number(l.credit) || 0) }), { d: 0, c: 0 }) : { d: 0, c: 0 }
  const setLine = (i: number, patch: Partial<Draft["lines"][number]>) => setDraft((d) => d && { ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const e = await adminFetch<Entry>("/api/admin/accounting/entries", { method: "POST", body: { ...draft, lines: draft.lines.filter((l) => l.account && (l.debit || l.credit)) } })
      toast(`Écriture ${e.number} enregistrée`)
      setDraft(null); load()
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") } finally { setSaving(false) }
  }
  const reverse = async (e: Entry) => {
    if (!(await confirm({ title: `Contre-passer ${e.number} ?`, message: "Une écriture inverse datée d'aujourd'hui annule ses effets. L'écriture d'origine reste visible (piste d'audit).", confirmLabel: "Contre-passer" }))) return
    try { const r = await adminFetch<Entry>(`/api/admin/accounting/entries/${e.id}`, { method: "POST", body: { action: "reverse" } }); toast(`Contre-passation ${r.number} enregistrée`); load() } catch (err) { toast(err instanceof Error ? err.message : "Erreur", "error") }
  }
  const remove = async (e: Entry) => {
    if (!(await confirm({ title: `Supprimer ${e.number} ?`, message: "Seules les saisies manuelles d'un exercice ouvert peuvent être supprimées.", confirmLabel: "Supprimer", danger: true }))) return
    try { await adminFetch(`/api/admin/accounting/entries/${e.id}`, { method: "DELETE" }); toast("Écriture supprimée"); load() } catch (err) { toast(err instanceof Error ? err.message : "Erreur", "error") }
  }

  return (
    <AccShell title="Journaux et écritures" year={year} onYear={(y) => { setYear(y); setPage(1) }} printTitle={`Journal des écritures — exercice ${year}`}
      actions={<>
        <a href={`/api/admin/accounting/export?type=entries&year=${year}`} className={`${btn2} flex items-center gap-1.5`}><Download size={14} /> Export CSV</a>
        <button onClick={() => setDraft({ journal: "OD", date: today(), label: "", reference: "", lines: [emptyLine(), emptyLine()] })} className={`${btn} flex items-center gap-1.5`}><Plus size={14} /> Nouvelle écriture</button>
      </>}>
      <datalist id="acc-accounts">{accounts.filter((a) => a.isActive).map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}</datalist>
      <div className={`${card} acc-noprint mb-4 flex flex-wrap items-end gap-2 p-3`}>
        <select value={f.journal} onChange={(e) => { setF({ ...f, journal: e.target.value }); setPage(1) }} className={input}>
          <option value="">Tous les journaux</option>{JOURNALS.map((j) => <option key={j.code} value={j.code}>{j.code} — {j.label}</option>)}
        </select>
        <label className="text-xs text-gray-500">Du<input type="date" value={f.from} onChange={(e) => { setF({ ...f, from: e.target.value }); setPage(1) }} className={`${input} ml-1`} /></label>
        <label className="text-xs text-gray-500">au<input type="date" value={f.to} onChange={(e) => { setF({ ...f, to: e.target.value }); setPage(1) }} className={`${input} ml-1`} /></label>
        <input value={f.account} onChange={(e) => { setF({ ...f, account: e.target.value }); setPage(1) }} list="acc-accounts" placeholder="Compte (ex. 411)" className={`${input} w-32`} />
        <input value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1) }} placeholder="Libellé, pièce, n°…" className={`${input} w-48`} />
        <select value={f.origin} onChange={(e) => { setF({ ...f, origin: e.target.value }); setPage(1) }} className={input}>
          <option value="">Automatiques et saisies</option><option value="auto">Automatiques</option><option value="manual">Saisies manuelles</option>
        </select>
        <span className="ml-auto text-xs text-gray-400">{data?.total ?? 0} écriture(s)</span>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-3 py-2">N°</th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Jal</th><th className="px-2 py-2">Libellé</th><th className="px-2 py-2">Pièce</th><th className="px-2 py-2 text-right">Montant</th><th className="acc-noprint px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {!data && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Chargement…</td></tr>}
            {data?.entries.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune écriture.</td></tr>}
            {data?.entries.map((e) => (
              <FragmentRows key={e.id} e={e} open={open === e.id} toggle={() => setOpen(open === e.id ? null : e.id)} label={label} onReverse={() => reverse(e)} onDelete={() => remove(e)} />
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 && (
        <div className="acc-noprint mt-3 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={btn2}>← Précédent</button>
          <span className="px-2 py-2 text-xs text-gray-500">Page {page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className={btn2}>Suivant →</button>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-5 py-4 font-semibold text-gray-800">Nouvelle écriture</div>
            <div className="space-y-3 p-5">
              <div className="grid gap-2 sm:grid-cols-4">
                <select value={draft.journal} onChange={(e) => setDraft({ ...draft, journal: e.target.value })} className={input}>{JOURNALS.filter((j) => j.code !== "AN").map((j) => <option key={j.code} value={j.code}>{j.code} — {j.label}</option>)}</select>
                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={input} />
                <input value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} placeholder="Pièce (n° facture…)" className={input} />
                <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Libellé *" className={input} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500"><tr><th className="py-1">Compte</th><th>Libellé de ligne</th><th>Tiers</th><th className="text-right">Débit</th><th className="text-right">Crédit</th><th></th></tr></thead>
                  <tbody>
                    {draft.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-1"><input value={l.account} onChange={(e) => setLine(i, { account: e.target.value })} list="acc-accounts" placeholder="Compte" className={`${input} w-28`} title={label.get(l.account) ?? ""} />
                          <div className="w-28 truncate text-[10px] text-gray-400">{label.get(l.account) ?? ""}</div></td>
                        <td className="pr-1"><input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} className={`${input} w-full`} /></td>
                        <td className="pr-1"><input value={l.thirdParty} onChange={(e) => setLine(i, { thirdParty: e.target.value })} className={`${input} w-28`} /></td>
                        <td className="pr-1"><input value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value.replace(/[^\d]/g, ""), credit: "" })} inputMode="numeric" className={`${input} w-28 text-right`} /></td>
                        <td className="pr-1"><input value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value.replace(/[^\d]/g, ""), debit: "" })} inputMode="numeric" className={`${input} w-28 text-right`} /></td>
                        <td><button onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })} className="p-1 text-gray-400 hover:text-red-500" title="Retirer la ligne"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="text-sm font-semibold">
                      <td colSpan={3} className="pt-2"><button onClick={() => setDraft({ ...draft, lines: [...draft.lines, emptyLine()] })} className="text-xs font-semibold text-blue-600 hover:underline">+ Ajouter une ligne</button></td>
                      <td className="pt-2 text-right">{fcfaZ(totals.d)}</td><td className="pt-2 text-right">{fcfaZ(totals.c)}</td><td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className={`rounded-lg px-3 py-2 text-xs ${totals.d === totals.c && totals.d > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {totals.d === totals.c && totals.d > 0 ? "Écriture équilibrée." : `Écart débit − crédit : ${fcfaZ(totals.d - totals.c)} FCFA (l'écriture doit être équilibrée).`}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setDraft(null)} className={btn2}>Annuler</button>
              <button onClick={save} disabled={saving || totals.d !== totals.c || totals.d === 0} className={btn}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </AccShell>
  )
}

function FragmentRows({ e, open, toggle, label, onReverse, onDelete }: { e: Entry; open: boolean; toggle: () => void; label: Map<string, string>; onReverse: () => void; onDelete: () => void }) {
  const amount = e.lines.reduce((s, l) => s + l.debit, 0)
  return (
    <>
      <tr onClick={toggle} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50">
        <td className="px-3 py-2 font-mono text-xs text-gray-500">{e.number}</td>
        <td className="px-2 py-2 text-xs text-gray-500">{dateFr(e.date)}</td>
        <td className="px-2 py-2 text-xs font-semibold text-gray-600">{e.journal}</td>
        <td className="px-2 py-2 text-gray-700">{e.label}{!e.sourceType && <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-600">saisie</span>}</td>
        <td className="px-2 py-2 text-xs text-gray-500">{e.reference}</td>
        <td className="px-2 py-2 text-right font-semibold text-gray-700">{fcfaZ(amount)}</td>
        <td className="acc-noprint px-3 py-2 text-right text-xs text-gray-400">{open ? "▲" : "▼"}</td>
      </tr>
      {open && (
        <tr className="bg-gray-50/60">
          <td colSpan={7} className="px-4 py-2">
            <table className="w-full text-xs">
              <tbody>
                {e.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="w-20 py-0.5 font-mono">{l.account}</td>
                    <td className="py-0.5 text-gray-500">{label.get(l.account)}</td>
                    <td className="py-0.5 text-gray-600">{l.label}{l.thirdParty ? ` · ${l.thirdParty}` : ""}</td>
                    <td className="w-28 py-0.5 text-right">{fcfa(l.debit)}</td>
                    <td className="w-28 py-0.5 text-right">{fcfa(l.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="acc-noprint mt-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-400">{e.sourceType ? `Automatique (${e.sourceType})` : `Saisie par ${e.createdBy ?? "—"}`}</span>
              <button onClick={onReverse} className="ml-auto flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"><Undo2 size={12} /> Contre-passer</button>
              {!e.sourceType && <button onClick={onDelete} className="flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"><Trash2 size={12} /> Supprimer</button>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
