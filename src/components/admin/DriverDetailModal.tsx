"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import { adminFetch, fmtDate, fmtMoney } from "@/lib/adminApi"

type Doc = { id: string; label: string; type: string; status: string; fileUrl?: string | null; expiresAt?: string | null }
type Driver = {
  id: string; driverId: number; name: string; phone?: string | null; email: string; serviceArea?: string | null
  vehicleType?: string | null; status: string; approvalStatus: string; rejectionReason?: string | null
  totalOrders: number; rating: number; earning: number; walletMoney: number; registeredAt: string
  documents?: Doc[]; orders?: { id: string; orderId: string; total: number; status: string; createdAt: string }[]
}

/** Fiche livreur complète (profil, documents, dernières commandes). */
export default function DriverDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [res, setRes] = useState<{ id: string; d?: Driver; err?: string } | null>(null)

  useEffect(() => {
    if (!id) return
    adminFetch<Driver>(`/api/drivers/${id}`).then((d) => setRes({ id, d })).catch((e) => setRes({ id, err: e.message }))
  }, [id])
  // Résultat d'un autre livreur (précédent) = encore en chargement
  const d = res?.id === id ? res.d ?? null : null
  const err = res?.id === id ? res.err ?? null : null

  if (!id) return null
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/40 sm:place-items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-800">Fiche livreur</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Fermer"><X size={18} /></button>
        </div>
        {err && <p className="p-6 text-sm text-red-500">{err}</p>}
        {!d && !err && <div className="space-y-2 p-6">{[0, 1, 2].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />)}</div>}
        {d && (
          <div className="space-y-5 p-5 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">{d.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{d.name} <span className="text-xs text-gray-400">#{d.driverId}</span></div>
                <div className="text-xs text-gray-500">{d.phone ?? "—"} · {d.email}</div>
              </div>
              <StatusBadge status={d.approvalStatus} />
              <StatusBadge status={d.status} />
            </div>
            {d.rejectionReason && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Motif du rejet : {d.rejectionReason}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Zone", d.serviceArea ?? "—"], ["Véhicule", d.vehicleType ?? "—"],
                ["Commandes", String(d.totalOrders)], ["Note", d.rating ? `${d.rating.toFixed(1)} ★` : "—"],
                ["Gains", fmtMoney(d.earning)], ["Portefeuille", fmtMoney(d.walletMoney)], ["Inscrit le", fmtDate(d.registeredAt)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-gray-50 p-2.5"><div className="text-[11px] text-gray-400">{k}</div><div className="font-medium text-gray-700">{v}</div></div>
              ))}
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-gray-700">Documents</h4>
              {d.documents?.length ? (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {d.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span>{doc.label} <span className="text-xs text-gray-400">{doc.expiresAt ? `· expire le ${fmtDate(doc.expiresAt).slice(0, 10)}` : ""}</span></span>
                      <span className="flex items-center gap-2">
                        {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">Ouvrir</a>}
                        <StatusBadge status={doc.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-400">Aucun document déposé.</p>}
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-gray-700">Dernières commandes</h4>
              {d.orders?.length ? (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {d.orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-3 py-2">
                      <span className="font-mono text-xs">#{o.orderId}</span><span>{fmtMoney(o.total)}</span><StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-400">Aucune commande.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
