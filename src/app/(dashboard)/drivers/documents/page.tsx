"use client"

import { useMemo, useState } from "react"
import { Eye, Check, X, Plus, Download, RefreshCw, Trash2 } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import FormModal from "@/components/admin/FormModal"
import DriverDetailModal from "@/components/admin/DriverDetailModal"
import { useFeedback, useAction } from "@/components/admin/Feedback"
import { useAdminData, useOptions } from "@/hooks/useAdminData"
import { adminFetch, exportCsv, fmtDate } from "@/lib/adminApi"

type Doc = { id: string; driverId: string; label: string; type: string; status: string; fileUrl?: string | null; expiresAt?: string | null; driver?: { name: string; phone?: string | null } }
const DAY = 86_400_000
const daysLeft = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / DAY) : null)

export default function DriversDocumentsPage() {
  const { items, loading, error, reload, create, update, remove } = useAdminData("crud/driver-documents")
  const docTypes = useOptions("records/documents")
  const [drivers, setDrivers] = useState<{ value: string; label: string }[]>([])
  const [tab, setTab] = useState<"expiring" | "pending" | "all">("expiring")
  const [q, setQ] = useState("")
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState<string | null>(null)
  const { confirm } = useFeedback()
  const run = useAction()

  const docs = items as unknown as Doc[]
  const rows = useMemo(() => docs.filter((d) => {
    const left = daysLeft(d.expiresAt)
    if (tab === "expiring" && (left === null || left > 30)) return false
    if (tab === "pending" && d.status !== "Pending") return false
    return !q || (d.driver?.name ?? "").toLowerCase().includes(q.toLowerCase()) || d.label.toLowerCase().includes(q.toLowerCase())
  }).sort((a, b) => (daysLeft(a.expiresAt) ?? 9999) - (daysLeft(b.expiresAt) ?? 9999)), [docs, tab, q])

  const openAdd = async () => {
    if (!drivers.length) {
      const r = await run(() => adminFetch<{ drivers: { id: string; name: string }[] }>("/api/drivers?perPage=100"))
      if (r) setDrivers(r.drivers.map((d) => ({ value: d.id, label: d.name })))
    }
    setAdding(true)
  }
  const setStatus = (d: Doc, status: string) => run(() => update(d.id, { status }), status === "Approved" ? "Document approuvé" : "Document rejeté")

  const counts = {
    expiring: docs.filter((d) => { const l = daysLeft(d.expiresAt); return l !== null && l <= 30 }).length,
    pending: docs.filter((d) => d.status === "Pending").length,
    all: docs.length,
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700"><span>⚠️</span> Documents des livreurs</h1>
        <div className="flex gap-2">
          <button onClick={() => exportCsv("documents-livreurs", [
            { key: "driver", label: "Livreur" }, { key: "label", label: "Document" }, { key: "expiresAt", label: "Expiration" }, { key: "status", label: "Statut" },
          ], rows.map((d) => ({ ...d, driver: d.driver?.name ?? "", expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : "" })))}
            disabled={!rows.length} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"><Download size={14} /> Exporter</button>
          <button onClick={openAdd} className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"><Plus size={14} /> Ajouter</button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {([["expiring", "Expirant sous 30 jours"], ["pending", "À vérifier"], ["all", "Tous"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === k ? "bg-indigo-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>
            {l} ({counts[k]})
          </button>
        ))}
        <input placeholder="Nom du livreur ou document..." value={q} onChange={(e) => setQ(e.target.value)}
          className="ml-auto w-60 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <button onClick={reload} title="Actualiser" className="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>{["N°", "Livreur", "Document", "Date d'expiration", "Jours restants", "Statut", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {error ? <tr><td colSpan={7} className="py-10 text-center text-sm text-red-500">{error}</td></tr>
              : !rows.length ? <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">{loading ? "Chargement…" : "Aucun document"}</td></tr>
              : rows.map((d, i) => {
                const left = daysLeft(d.expiresAt)
                return (
                  <tr key={d.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-800">{d.driver?.name ?? "—"}</div><div className="text-xs text-gray-500">{d.driver?.phone ?? ""}</div></td>
                    <td className="px-4 py-3 text-gray-700">{d.label}</td>
                    <td className="px-4 py-3 text-gray-600">{d.expiresAt ? fmtDate(d.expiresAt).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-3">
                      {left === null ? <span className="text-xs text-gray-400">—</span> : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${left < 0 ? "bg-red-600 text-white" : left <= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {left < 0 ? `Expiré (${-left} j)` : `${left} jours`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {d.fileUrl
                          ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600" title="Voir le document"><Eye size={12} /></a>
                          : <button onClick={() => setView(d.driverId)} className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600" title="Voir le livreur"><Eye size={12} /></button>}
                        <button onClick={() => setStatus(d, "Approved")} disabled={d.status === "Approved"} className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600 disabled:opacity-40" title="Approuver"><Check size={12} /></button>
                        <button onClick={() => setStatus(d, "Rejected")} disabled={d.status === "Rejected"} className="rounded bg-orange-500 p-1.5 text-white hover:bg-orange-600 disabled:opacity-40" title="Rejeter"><X size={12} /></button>
                        <button onClick={async () => { if (await confirm({ title: "Supprimer ce document ?", confirmLabel: "Supprimer", danger: true })) run(() => remove(d.id), "Document supprimé") }}
                          className="rounded bg-red-500 p-1.5 text-white hover:bg-red-600" title="Supprimer"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <DriverDetailModal id={view} onClose={() => setView(null)} />
      <FormModal
        open={adding} title="Ajouter un document" onClose={() => setAdding(false)}
        initial={{ status: "Pending" }}
        fields={[
          { key: "driverId", label: "Livreur", type: "select", options: drivers, required: true },
          { key: "label", label: "Document", type: "select", options: docTypes, required: true },
          { key: "expiresAt", label: "Date d'expiration", type: "date" },
          { key: "status", label: "Statut", type: "select", required: true, options: [{ value: "Pending", label: "À vérifier" }, { value: "Approved", label: "Approuvé" }, { value: "Rejected", label: "Rejeté" }] },
          { key: "fileUrl", label: "Lien du fichier", type: "url", full: true },
        ]}
        onSubmit={async (v) => {
          const ok = await run(() => create({ ...v, type: String(v.label ?? "") }), "Document ajouté")
          if (ok) { setAdding(false); reload() }
        }}
      />
    </div>
  )
}
