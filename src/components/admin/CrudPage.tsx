"use client"

import { useMemo, useState } from "react"
import { Plus, Edit, Trash2, Download, RefreshCw, Search } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import FormModal, { type Field } from "./FormModal"
import { useFeedback, useAction } from "./Feedback"
import { useAdminData, type Row } from "@/hooks/useAdminData"
import { exportCsv } from "@/lib/adminApi"

export type Column = {
  key: string
  label: string
  render?: (row: Row) => React.ReactNode
  csv?: (row: Row) => unknown // valeur exportée (défaut : row[key])
  className?: string
}

type Props = {
  title: string
  icon?: React.ReactNode
  description?: string
  source: string // "crud/<modele>" | "records/<collection>"
  seed?: Record<string, unknown>[]
  columns: Column[]
  fields: Field[]
  itemLabel?: string // « un pays », « une FAQ »…
  defaults?: Record<string, unknown>
  toForm?: (row: Row) => Record<string, unknown>
  fromForm?: (values: Record<string, unknown>) => Record<string, unknown>
  rowActions?: (row: Row, api: ReturnType<typeof useAdminData>) => React.ReactNode
  headerActions?: (api: ReturnType<typeof useAdminData>) => React.ReactNode
  statusKey?: string | null // clic sur le badge = bascule Actif/Inactif
  filter?: (row: Row) => boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  exportName?: string
}

export default function CrudPage({
  title, icon, description, source, seed, columns, fields, itemLabel = "un élément", defaults,
  toForm, fromForm, rowActions, headerActions, statusKey = "status", filter,
  canCreate = true, canEdit = true, canDelete = true, exportName,
}: Props) {
  const api = useAdminData(source, seed)
  const { items, loading, error, reload, create, update, remove } = api
  const { confirm } = useFeedback()
  const run = useAction()
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => {
    const base = filter ? items.filter(filter) : items
    if (!q.trim()) return base
    const s = q.toLowerCase()
    return base.filter((r) => Object.values(r).some((v) => v !== null && typeof v !== "object" && String(v).toLowerCase().includes(s)))
  }, [items, q, filter])

  const initial = useMemo(
    () => (editing ? (toForm ? toForm(editing) : editing) : { status: "Active", ...defaults }),
    [editing, toForm, defaults]
  )

  const submit = async (values: Record<string, unknown>) => {
    const data = fromForm ? fromForm(values) : values
    const ok = editing
      ? await run(() => update(editing.id, data), "Modifications enregistrées")
      : await run(() => create(data), "Élément ajouté")
    if (ok) { setEditing(null); setCreating(false) }
  }

  const del = async (row: Row) => {
    if (await confirm({ title: "Supprimer cet élément ?", message: "Cette action est définitive.", confirmLabel: "Supprimer", danger: true })) {
      await run(() => remove(row.id), "Élément supprimé")
    }
  }

  const toggleStatus = (row: Row) => {
    if (!statusKey) return
    const next = row[statusKey] === "Active" ? "Inactive" : "Active"
    run(() => update(row.id, { [statusKey]: next }), next === "Active" ? "Activé" : "Désactivé")
  }

  const doExport = () =>
    exportCsv(exportName ?? source.split("/").pop()!, columns.filter((c) => c.key !== "_actions"),
      rows.map((r) => Object.fromEntries(columns.map((c) => [c.key, c.csv ? c.csv(r) : r[c.key]]))))

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">{icon && <span>{icon}</span>} {title}</h1>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {headerActions?.(api)}
          <button onClick={doExport} disabled={rows.length === 0}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <Download size={14} /> Exporter
          </button>
          {canCreate && (
            <button onClick={() => { setEditing(null); setCreating(true) }}
              className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600">
              <Plus size={14} /> Ajouter
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..."
            className="w-56 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <button onClick={reload} title="Actualiser" className="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">N°</th>
              {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">{c.label}</th>)}
              {(canEdit || canDelete || rowActions) && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && items.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={columns.length + 2} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100" /></td></tr>
              ))
            ) : error ? (
              <tr><td colSpan={columns.length + 2} className="py-10 text-center text-sm text-red-500">
                {error} — <button onClick={reload} className="underline">Réessayer</button>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 2} className="py-10 text-center text-sm text-gray-400">Aucun résultat trouvé</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={c.className ?? "px-4 py-3 text-gray-700"}>
                    {c.render ? c.render(r)
                      : statusKey && c.key === statusKey ? (
                        <button onClick={() => toggleStatus(r)} title="Cliquer pour activer / désactiver" disabled={!canEdit}>
                          <StatusBadge status={String(r[c.key] ?? "")} />
                        </button>
                      ) : String(r[c.key] ?? "—")}
                  </td>
                ))}
                {(canEdit || canDelete || rowActions) && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {rowActions?.(r, api)}
                      {canEdit && <button onClick={() => { setCreating(false); setEditing(r) }} title="Modifier" className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600"><Edit size={12} /></button>}
                      {canDelete && <button onClick={() => del(r)} title="Supprimer" className="rounded bg-red-500 p-1.5 text-white hover:bg-red-600"><Trash2 size={12} /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t p-3 text-xs text-gray-400">Affichage de {rows.length} sur {items.length} entrées</div>
      </div>

      <FormModal
        open={creating || !!editing}
        title={editing ? `Modifier ${itemLabel}` : `Ajouter ${itemLabel}`}
        fields={fields}
        initial={initial}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSubmit={submit}
      />
    </div>
  )
}
