"use client"

import ReportView from "@/components/admin/ReportView"
import { fmtMoney } from "@/lib/adminApi"

const n = (v: unknown) => Number(v ?? 0).toLocaleString("fr-FR")

export default function BalanceReportPage() {
  return (
    <ReportView
      title="Rapport de solde" icon="📊" kind="balance" exportName="soldes-portefeuilles" searchPlaceholder="Nom, téléphone..."
      columns={[
        { key: "name", label: "Compte", render: (r) => <div><div className="font-medium text-gray-800">{String(r.name)}</div><div className="text-xs text-gray-500">{String(r.phone ?? "")}</div></div> },
        { key: "type", label: "Type", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.type === "Livreur" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{String(r.type)}</span> },
        { key: "credits", label: "Crédits (FCFA)", render: (r) => <span className="font-semibold text-green-600">{n(r.credits)}</span> },
        { key: "debits", label: "Débits (FCFA)", render: (r) => <span className="font-semibold text-red-600">{n(r.debits)}</span> },
        { key: "balance", label: "Solde actuel (FCFA)", render: (r) => <span className="font-bold text-cyan-600">{n(r.balance)}</span> },
      ]}
      extraFilters={(_rows, set) => (
        <div><label className="mb-1 block text-xs text-gray-500">Type</label>
          <select onChange={(e) => { const v = e.target.value; set((r) => !v || r.type === v) }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Tous</option><option value="Client">Clients</option><option value="Livreur">Livreurs</option>
          </select></div>
      )}
      kpis={(rows) => [
        { label: "Total crédits", value: fmtMoney(rows.reduce((s, r) => s + Number(r.credits), 0)), color: "bg-green-500" },
        { label: "Total débits", value: fmtMoney(rows.reduce((s, r) => s + Number(r.debits), 0)), color: "bg-red-500" },
        { label: "Soldes cumulés", value: fmtMoney(rows.reduce((s, r) => s + Number(r.balance), 0)), color: "bg-cyan-500" },
      ]}
    />
  )
}
