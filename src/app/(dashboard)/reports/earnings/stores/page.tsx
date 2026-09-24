"use client"

import ReportView from "@/components/admin/ReportView"
import { fmtMoney } from "@/lib/adminApi"

export default function StoresEarningsPage() {
  return (
    <ReportView
      title="Gains boutiques" icon="🏪" kind="store-earnings" exportName="gains-boutiques" chartTitle="Chiffre d'affaires mensuel des boutiques (hors commission, FCFA)"
      searchPlaceholder="Nom de la boutique..."
      columns={[
        { key: "name", label: "Boutique", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "orders", label: "Commandes livrées" },
        { key: "earning", label: "Gains (FCFA)", render: (r) => <span className="font-semibold text-green-600">{Number(r.earning).toLocaleString("fr-FR")}</span> },
      ]}
      kpis={(rows, d) => [
        { label: "Total gains boutiques", value: fmtMoney(rows.reduce((s, r) => s + Number(r.earning), 0)), color: "bg-green-500" },
        { label: "Commandes livrées", value: d.totals?.orders ?? 0, color: "bg-blue-500" },
        { label: "Boutiques actives", value: rows.filter((r) => Number(r.orders) > 0).length, color: "bg-purple-500" },
      ]}
    />
  )
}
