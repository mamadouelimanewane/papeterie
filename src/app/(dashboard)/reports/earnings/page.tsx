"use client"

import { useState } from "react"
import StatusBadge from "@/components/ui/StatusBadge"
import ReportView from "@/components/admin/ReportView"
import { fmtDate, fmtMoney } from "@/lib/adminApi"

type Row = { id: string; [k: string]: unknown }

function EarningsFilters({ rows, set }: { rows: Row[]; set: (f: (r: Row) => boolean) => void }) {
  const [store, setStore] = useState("")
  const [status, setStatus] = useState("")
  const stores = [...new Set(rows.map((r) => String(r.store)))]
  const apply = (st: string, ss: string) => { setStore(st); setStatus(ss); set((r) => (!st || r.store === st) && (!ss || r.status === ss)) }
  return (
    <>
      <div><label className="mb-1 block text-xs text-gray-500">Boutique</label>
        <select value={store} onChange={(e) => apply(e.target.value, status)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Toutes</option>{stores.map((s) => <option key={s}>{s}</option>)}
        </select></div>
      <div><label className="mb-1 block text-xs text-gray-500">Statut</label>
        <select value={status} onChange={(e) => apply(store, e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Tous</option>{["Pending", "Processing", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select></div>
    </>
  )
}

const n = (v: unknown) => Number(v ?? 0).toLocaleString("fr-FR")

export default function EarningsPage() {
  return (
    <ReportView
      title="Rapport des revenus" icon="💹" kind="earnings" exportName="rapport-revenus" chartTitle="Commission plateforme par mois (FCFA)"
      searchPlaceholder="N° commande, client..."
      extraFilters={(rows, set) => <EarningsFilters rows={rows} set={set} />}
      columns={[
        { key: "orderId", label: "Commande", className: "px-4 py-3 font-mono text-xs font-semibold text-blue-600" },
        { key: "store", label: "Boutique" },
        { key: "user", label: "Client" },
        { key: "driver", label: "Livreur" },
        { key: "product", label: "Articles", className: "max-w-xs truncate px-4 py-3 text-xs text-gray-500" },
        { key: "subtotal", label: "Sous-total", render: (r) => n(r.subtotal) },
        { key: "deliveryFee", label: "Livraison", render: (r) => n(r.deliveryFee) },
        { key: "total", label: "Total", render: (r) => <span className="font-semibold">{n(r.total)}</span> },
        { key: "payment", label: "Paiement" },
        { key: "platformEarning", label: "Commission", render: (r) => <span className="font-semibold text-indigo-600">{n(r.platformEarning)}</span> },
        { key: "storeEarning", label: "Part boutique", render: (r) => <span className="text-green-600">{n(r.storeEarning)}</span> },
        { key: "status", label: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
        { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs text-gray-500">{fmtDate(r.date)}</span>, csv: (r) => fmtDate(r.date) },
      ]}
      kpis={(rows, d) => [
        { label: "Montant total des commandes", value: fmtMoney(rows.reduce((s, r) => s + Number(r.total), 0)), color: "bg-blue-500" },
        { label: `Commission plateforme (${d.commissionPct ?? 10} %)`, value: fmtMoney(rows.reduce((s, r) => s + Number(r.platformEarning), 0)), color: "bg-indigo-500" },
        { label: "Commandes livrées", value: rows.filter((r) => r.status === "Delivered" || r.status === "Completed").length, color: "bg-green-500" },
      ]}
    />
  )
}
