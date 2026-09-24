"use client"

import ReportView from "@/components/admin/ReportView"
import { fmtMoney } from "@/lib/adminApi"

export default function DriversEarningsPage() {
  return (
    <ReportView
      title="Gains livreurs" icon="🚗" kind="driver-earnings" exportName="gains-livreurs" chartTitle="Gains mensuels des livreurs (frais de livraison, FCFA)"
      searchPlaceholder="Nom du livreur..."
      columns={[
        { key: "name", label: "Livreur", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "orders", label: "Livraisons" },
        { key: "earning", label: "Gains (FCFA)", render: (r) => <span className="font-semibold text-blue-600">{Number(r.earning).toLocaleString("fr-FR")}</span> },
      ]}
      kpis={(rows, d) => [
        { label: "Total gains livreurs", value: fmtMoney(rows.reduce((s, r) => s + Number(r.earning), 0)), color: "bg-blue-500" },
        { label: "Livraisons effectuées", value: d.totals?.orders ?? 0, color: "bg-green-500" },
        { label: "Livreurs actifs", value: rows.filter((r) => Number(r.orders) > 0).length, color: "bg-purple-500" },
      ]}
    />
  )
}
