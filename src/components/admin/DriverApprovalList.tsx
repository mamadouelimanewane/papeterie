"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, Check, X, RefreshCw, Download } from "lucide-react"
import DriverDetailModal from "./DriverDetailModal"
import FormModal from "./FormModal"
import { useFeedback, useAction } from "./Feedback"
import { adminFetch, exportCsv, fmtDate } from "@/lib/adminApi"

type Driver = {
  id: string; driverId: number; name: string; phone?: string | null; email: string; serviceArea?: string | null
  vehicleType?: string | null; approvalStatus: string; rejectionReason?: string | null; registeredAt: string; updatedAt: string
  documents?: { status: string }[]
}

const REASONS = ["Documents invalides", "Documents incomplets", "Photo non conforme", "Zone non couverte", "Autre"]

/** Liste des livreurs en attente (approuver / rejeter) ou rejetés (réexaminer). */
export default function DriverApprovalList({ mode }: { mode: "Pending" | "Rejected" }) {
  const [rows, setRows] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Driver | null>(null)
  const { confirm } = useFeedback()
  const run = useAction()

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await adminFetch<{ drivers: Driver[] }>(`/api/drivers?approvalStatus=${mode}&perPage=100`)
      setRows(r.drivers)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") } finally { setLoading(false) }
  }, [mode])
  useEffect(() => { load() }, [load])

  const patch = (id: string, data: Record<string, unknown>) => adminFetch(`/api/drivers/${id}`, { method: "PATCH", body: data })

  const approve = async (d: Driver) => {
    if (!(await confirm({ title: `Approuver ${d.name} ?`, message: "Le livreur pourra se connecter et recevoir des commandes.", confirmLabel: "Approuver" }))) return
    const ok = await run(() => patch(d.id, { approvalStatus: "Approved", rejectionReason: null }), `${d.name} approuvé`)
    if (ok) setRows((l) => l.filter((x) => x.id !== d.id))
  }
  const reexamine = async (d: Driver) => {
    const ok = await run(() => patch(d.id, { approvalStatus: "Pending", rejectionReason: null }), `${d.name} remis en attente d'approbation`)
    if (ok) setRows((l) => l.filter((x) => x.id !== d.id))
  }

  const pending = mode === "Pending"
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
          {pending ? "🕐 Livreurs en attente d'approbation" : "❌ Livreurs rejetés"}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pending ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{rows.length}</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={load} title="Actualiser" className="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          <button disabled={!rows.length} onClick={() => exportCsv(pending ? "livreurs-en-attente" : "livreurs-rejetes",
            [{ key: "driverId", label: "ID" }, { key: "name", label: "Nom" }, { key: "phone", label: "Téléphone" }, { key: "email", label: "E-mail" }, { key: "serviceArea", label: "Zone" }, { key: "rejectionReason", label: "Motif" }], rows)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"><Download size={14} /> Exporter</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>{["N°", "ID", "Livreur", "Zone", pending ? "Véhicule" : "Motif du rejet", pending ? "Documents" : "Date rejet", pending ? "Date demande" : "", "Action"].filter(Boolean).map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {error ? <tr><td colSpan={8} className="py-10 text-center text-sm text-red-500">{error}</td></tr>
              : loading && !rows.length ? <tr><td colSpan={8} className="p-4"><div className="h-4 animate-pulse rounded bg-gray-100" /></td></tr>
              : !rows.length ? <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">{pending ? "Aucune demande en attente 🎉" : "Aucun livreur rejeté"}</td></tr>
              : rows.map((d, i) => {
                const docsOk = d.documents?.filter((x) => x.status === "Approved").length ?? 0
                const docsTotal = d.documents?.length ?? 0
                return (
                  <tr key={d.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{d.driverId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.phone ?? "—"}</div>
                      <div className="text-xs text-gray-400">{d.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.serviceArea ?? "—"}</td>
                    {pending ? (
                      <>
                        <td className="px-4 py-3 text-gray-600">{d.vehicleType ?? "—"}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${docsTotal && docsOk === docsTotal ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{docsOk}/{docsTotal} docs</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{fmtDate(d.registeredAt)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3"><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{d.rejectionReason ?? "Non précisé"}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{fmtDate(d.updatedAt)}</td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setView(d.id)} className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600" title="Voir profil"><Eye size={12} /></button>
                        {pending ? (
                          <>
                            <button onClick={() => approve(d)} className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600" title="Approuver"><Check size={12} /></button>
                            <button onClick={() => setRejecting(d)} className="rounded bg-red-500 p-1.5 text-white hover:bg-red-600" title="Rejeter"><X size={12} /></button>
                          </>
                        ) : (
                          <button onClick={() => reexamine(d)} className="rounded bg-orange-500 p-1.5 text-white hover:bg-orange-600" title="Réexaminer"><RefreshCw size={12} /></button>
                        )}
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
        open={!!rejecting} title={`Rejeter ${rejecting?.name ?? ""}`} submitLabel="Rejeter"
        initial={{ reason: REASONS[0] }}
        fields={[
          { key: "reason", label: "Motif", type: "select", options: REASONS, required: true, full: true },
          { key: "details", label: "Précisions (facultatif)", type: "textarea" },
        ]}
        onClose={() => setRejecting(null)}
        onSubmit={async (v) => {
          const d = rejecting!
          const reason = v.details ? `${v.reason} — ${v.details}` : String(v.reason)
          const ok = await run(() => patch(d.id, { approvalStatus: "Rejected", rejectionReason: reason }), `${d.name} rejeté`)
          if (ok) { setRows((l) => l.filter((x) => x.id !== d.id)); setRejecting(null) }
        }}
      />
    </div>
  )
}
