"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Trash2, Save } from "lucide-react"
import { useAdminData, type Row } from "@/hooks/useAdminData"
import { useAction } from "@/components/admin/Feedback"
import FormModal from "@/components/admin/FormModal"

type Str = { key: string; value: string }
const SEED = [
  { key: "module.orders", label: "Commandes", enabled: true, strings: [{ key: "orders.title", value: "Mes commandes" }, { key: "orders.empty", value: "Aucune commande pour le moment" }, { key: "orders.track", value: "Suivre ma commande" }] },
  { key: "module.wallet", label: "Portefeuille", enabled: true, strings: [{ key: "wallet.title", value: "Mon portefeuille" }, { key: "wallet.balance", value: "Solde disponible" }, { key: "wallet.recharge", value: "Recharger" }] },
  { key: "module.kits", label: "Kits par classe", enabled: true, strings: [{ key: "kits.title", value: "Kits scolaires par classe" }, { key: "kits.customize", value: "Personnaliser le kit" }] },
  { key: "module.reviews", label: "Avis & notes", enabled: false, strings: [{ key: "reviews.title", value: "Avis clients" }, { key: "reviews.write", value: "Laisser un avis" }] },
  { key: "module.referral", label: "Parrainage", enabled: false, strings: [{ key: "referral.title", value: "Parrainez vos amis" }, { key: "referral.code", value: "Votre code parrain" }] },
]

function ModuleCard({ m, onSave, onToggle }: { m: Row; onSave: (strings: Str[]) => Promise<unknown>; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  const [strings, setStrings] = useState<Str[]>(() => (Array.isArray(m.strings) ? (m.strings as Str[]) : []))
  const [dirty, setDirty] = useState(false)
  const edit = (i: number, k: keyof Str, v: string) => { setStrings((l) => l.map((s, j) => (j === i ? { ...s, [k]: v } : s))); setDirty(true) }
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-2 text-left">
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="font-semibold text-gray-800">{String(m.label)}</span>
          <span className="font-mono text-xs text-gray-400">{String(m.key)}</span>
          <span className="text-xs text-gray-400">· {strings.length} texte(s)</span>
        </button>
        <button onClick={onToggle} role="switch" aria-checked={Boolean(m.enabled)} title={m.enabled ? "Désactiver le module" : "Activer le module"}
          className={`relative h-6 w-11 rounded-full transition ${m.enabled ? "bg-green-500" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${m.enabled ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-gray-100 p-4">
          {strings.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.key} onChange={(e) => edit(i, "key", e.target.value)} className="w-48 rounded-lg border border-gray-200 px-2 py-1.5 font-mono text-xs" />
              <input value={s.value} onChange={(e) => edit(i, "value", e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
              <button onClick={() => { setStrings((l) => l.filter((_, j) => j !== i)); setDirty(true) }} title="Supprimer" className="rounded bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={12} /></button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setStrings((l) => [...l, { key: `${String(m.key).replace("module.", "")}.`, value: "" }]); setDirty(true) }}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"><Plus size={12} /> Ajouter un texte</button>
            <button disabled={!dirty} onClick={async () => { if (await onSave(strings.filter((s) => s.key.trim()))) setDirty(false) }}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"><Save size={12} /> Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModuleStringsPage() {
  const { items, loading, error, create, update } = useAdminData("records/module-strings", SEED)
  const run = useAction()
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState("")
  const shown = items.filter((m) => !q || `${m.label} ${m.key} ${JSON.stringify(m.strings)}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">🧩 Modules & textes</h1>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"><Plus size={14} /> Ajouter un module</button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && !items.length && <div className="h-16 animate-pulse rounded-xl bg-white" />}
      {shown.map((m) => (
        <ModuleCard key={m.id} m={m}
          onToggle={() => run(() => update(m.id, { enabled: !m.enabled }), m.enabled ? "Module désactivé" : "Module activé")}
          onSave={(strings) => run(() => update(m.id, { strings }), "Textes enregistrés")} />
      ))}
      <FormModal open={adding} title="Ajouter un module" onClose={() => setAdding(false)}
        fields={[{ key: "label", label: "Nom du module", required: true }, { key: "key", label: "Clé", required: true, placeholder: "module.exemple" }]}
        onSubmit={async (v) => { if (await run(() => create({ ...v, enabled: true, strings: [] }), "Module ajouté")) setAdding(false) }} />
    </div>
  )
}
