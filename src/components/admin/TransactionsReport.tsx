"use client"

import StatusBadge from "@/components/ui/StatusBadge"
import ReportView from "./ReportView"
import type { Column } from "./CrudPage"
import { fmtDate, fmtMoney } from "@/lib/adminApi"

const n = (v: unknown) => Number(v ?? 0).toLocaleString("fr-FR")

/** Rapport des transactions : toutes, ou filtrées par type de compte (client / livreur / boutique). */
export default function TransactionsReport({ party, title, icon }: { party?: "user" | "driver" | "store"; title: string; icon: string }) {
  const who = party === "driver" ? "Livreur" : party === "store" ? "Boutique" : party === "user" ? "Client" : "Compte"
  const columns: Column[] = [
    { key: "ref", label: "Référence", className: "px-4 py-3 font-mono text-xs text-blue-600" },
    { key: "name", label: who, render: (r) => <div><div className="font-medium text-gray-800">{String(r.name)}</div><div className="text-xs text-gray-500">{String(r.phone ?? "")}</div></div> },
    ...(!party ? [{ key: "party", label: "Type de compte" } as Column] : []),
    { key: "direction", label: "Sens", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.direction === "Crédit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{String(r.direction)}</span> },
    { key: "type", label: "Opération" },
    { key: "amount", label: "Montant (FCFA)", render: (r) => <span className="font-semibold text-gray-800">{n(r.amount)}</span> },
    { key: "method", label: "Méthode" },
    { key: "description", label: "Description", className: "px-4 py-3 text-xs text-gray-500" },
    { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs text-gray-500">{fmtDate(r.date)}</span>, csv: (r) => fmtDate(r.date) },
    { key: "status", label: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  ]
  return (
    <ReportView
      title={title} icon={icon} kind="transactions" params={party ? { party } : undefined}
      exportName={`transactions-${party ?? "toutes"}`} columns={columns}
      searchPlaceholder={`${who}, référence...`}
      kpis={(rows) => {
        const done = rows.filter((r) => r.status === "Completed")
        const credit = done.filter((r) => r.direction === "Crédit").reduce((s, r) => s + Number(r.amount), 0)
        const debit = done.filter((r) => r.direction === "Débit").reduce((s, r) => s + Number(r.amount), 0)
        return [
          { label: "Total crédits", value: fmtMoney(credit), color: "bg-green-500" },
          { label: "Total débits", value: fmtMoney(debit), color: "bg-red-500" },
          { label: "Transactions", value: rows.length, color: "bg-cyan-500" },
        ]
      }}
    />
  )
}
