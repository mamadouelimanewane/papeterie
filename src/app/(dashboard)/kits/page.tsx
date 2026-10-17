"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, X } from "lucide-react"
import { useFeedback, useAction } from "@/components/admin/Feedback"
import { adminFetch, fmtMoney } from "@/lib/adminApi"

type KitItem = { name: string; price: number; qty: number; vatRate?: number }
type Kit = {
  id: string; name: string; level: string; series: string | null; cycle: string; description: string | null
  image: string | null; price: number; discountPct: number; items: KitItem[]; sequence: number; status: string
}
type Draft = Omit<Kit, "id" | "price" | "items" | "sequence"> & { id?: string; items: { name: string; price: string; qty: string; vatRate: string }[] }

const CYCLES = [{ v: "Primaire", l: "Primaire" }, { v: "College", l: "Collège" }, { v: "Lycee", l: "Lycée" }]
const sold = (k: { price: number; discountPct: number }) => Math.round(k.price * (1 - (k.discountPct || 0) / 100))
const emptyDraft = (): Draft => ({ name: "", level: "", series: "", cycle: "Primaire", description: "", image: "", discountPct: 0, status: "Active", items: [{ name: "", price: "", qty: "1", vatRate: "" }] })

/**
 * Kits par classe vendus dans la vitrine (/shop/kits) : liste des articles de chaque classe, avec remise.
 * Le prix catalogue est la somme des articles ; le prix payé applique la remise.
 */
export default function KitsPage() {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast, confirm } = useFeedback()
  const run = useAction()

  const load = useCallback(async () => {
    try { setKits(await adminFetch<Kit[]>("/api/admin/kits")) } catch (e) { setKits([]); toast(e instanceof Error ? e.message : "Erreur", "error") }
  }, [toast])
  useEffect(() => { load() }, [load])

  const total = useMemo(() => (draft ? draft.items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0) : 0), [draft])

  const edit = (k: Kit) => setDraft({ ...k, series: k.series ?? "", description: k.description ?? "", image: k.image ?? "", items: k.items.map((i) => ({ name: i.name, price: String(i.price), qty: String(i.qty), vatRate: i.vatRate == null ? "" : String(i.vatRate) })) })
  const setItem = (idx: number, patch: Partial<Draft["items"][number]>) => setDraft((d) => d && { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) })

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const body = {
        name: draft.name, level: draft.level, series: draft.series, cycle: draft.cycle, description: draft.description, image: draft.image,
        discountPct: Number(draft.discountPct) || 0, status: draft.status,
        items: draft.items.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), price: Number(i.price), qty: Number(i.qty), vatRate: i.vatRate })),
      }
      const ok = await run(() => adminFetch(draft.id ? `/api/admin/kits/${draft.id}` : "/api/admin/kits", { method: draft.id ? "PATCH" : "POST", body }), draft.id ? "Kit modifié" : "Kit créé")
      if (ok) { setDraft(null); load() }
    } finally { setSaving(false) }
  }
  async function toggle(k: Kit) {
    const status = k.status === "Active" ? "Inactive" : "Active"
    if (await run(() => adminFetch(`/api/admin/kits/${k.id}`, { method: "PATCH", body: { status } }), status === "Active" ? "Kit affiché dans la vitrine" : "Kit masqué de la vitrine")) load()
  }
  async function remove(k: Kit) {
    if (!(await confirm({ title: `Supprimer « ${k.name} » ?`, message: "Le kit disparaît de la vitrine. Les commandes passées gardent leur détail.", confirmLabel: "Supprimer", danger: true }))) return
    if (await run(() => adminFetch(`/api/admin/kits/${k.id}`, { method: "DELETE" }), "Kit supprimé")) load()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-700">🎒 Kits par classe</h1>
          <p className="text-xs text-gray-500">Packs de fournitures vendus dans la vitrine (page « Kits par classe »). Prix payé = somme des articles − remise.</p>
        </div>
        <button onClick={() => setDraft(emptyDraft())} className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"><Plus size={16} /> Nouveau kit</button>
      </div>

      {kits === null ? <p className="py-10 text-center text-sm text-gray-400">Chargement...</p> : kits.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-gray-100">Aucun kit. Créez le premier avec « Nouveau kit ».</p>
      ) : CYCLES.map((c) => {
        const list = kits.filter((k) => k.cycle === c.v)
        if (!list.length) return null
        return (
          <div key={c.v} className="mb-5 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600">{c.l} · {list.length} kit(s)</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500">
                {["Classe", "Nom", "Articles", "Prix catalogue", "Remise", "Prix payé", "Statut", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-2 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2 font-medium">{k.level}{k.series ? ` ${k.series}` : ""}</td>
                    <td className="px-4 py-2">{k.name}</td>
                    <td className="px-4 py-2 text-gray-500">{k.items.length}</td>
                    <td className="px-4 py-2 text-gray-500">{fmtMoney(k.price)}</td>
                    <td className="px-4 py-2 text-gray-500">{k.discountPct ? `-${k.discountPct} %` : "—"}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800">{fmtMoney(sold(k))}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${k.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{k.status === "Active" ? "En vitrine" : "Masqué"}</span></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button title="Modifier" onClick={() => edit(k)} className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"><Edit size={12} /></button>
                        <button title={k.status === "Active" ? "Masquer de la vitrine" : "Afficher dans la vitrine"} onClick={() => toggle(k)} className="rounded bg-yellow-500 p-1 text-white hover:bg-yellow-600">{k.status === "Active" ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                        <button title="Supprimer" onClick={() => remove(k)} className="rounded bg-red-500 p-1 text-white hover:bg-red-600"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold text-gray-800">{draft.id ? `Modifier « ${draft.name} »` : "Nouveau kit"}</h2>
              <button onClick={() => setDraft(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-gray-500">Nom du kit *<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Kit CM2" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
                <label className="text-xs text-gray-500">Cycle *<select value={draft.cycle} onChange={(e) => setDraft({ ...draft, cycle: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800">{CYCLES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select></label>
                <label className="text-xs text-gray-500">Classe *<input value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} placeholder="CM2, 6eme, Terminale…" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
                <label className="text-xs text-gray-500">Série (lycée)<input value={draft.series ?? ""} onChange={(e) => setDraft({ ...draft, series: e.target.value })} placeholder="L, S1, S2…" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
                <label className="text-xs text-gray-500">Remise du kit (%)<input type="number" min={0} max={90} value={draft.discountPct} onChange={(e) => setDraft({ ...draft, discountPct: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
                <label className="text-xs text-gray-500">Image (adresse, facultatif)<input value={draft.image ?? ""} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="/generic/cahier.jpg" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>
              </div>
              <label className="block text-xs text-gray-500">Description<textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" /></label>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600"><span>Articles du kit *</span><span>{draft.items.filter((i) => i.name.trim()).length} article(s)</span></div>
                <div className="space-y-1.5">
                  {draft.items.map((it, i) => (
                    <div key={i} className="flex gap-1.5">
                      <input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Ex. Cahier 100 pages" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                      <input value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} inputMode="numeric" placeholder="Prix" className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                      <input value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} inputMode="numeric" placeholder="Qté" className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                      <select value={it.vatRate} onChange={(e) => setItem(i, { vatRate: e.target.value })} title="TVA (auto : taux du produit de même nom au catalogue)" className="w-20 rounded-lg border border-gray-200 bg-white px-1 py-1.5 text-xs">
                        <option value="">TVA auto</option><option value="0">0 %</option><option value="10">10 %</option><option value="18">18 %</option>
                      </select>
                      <button title="Retirer" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })} className="rounded-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setDraft({ ...draft, items: [...draft.items, { name: "", price: "", qty: "1", vatRate: "" }] })} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">+ Ajouter un article</button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-500">Prix catalogue <b className="text-gray-700">{fmtMoney(total)}</b>{draft.discountPct ? ` − ${draft.discountPct} %` : ""}</span>
                <span className="font-bold text-gray-800">Prix payé : {fmtMoney(sold({ price: total, discountPct: Number(draft.discountPct) || 0 }))}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={draft.status === "Active"} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? "Active" : "Inactive" })} /> Afficher dans la vitrine</label>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <button onClick={() => setDraft(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
