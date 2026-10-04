"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const TYPES = [{ value: "User", label: "Client" }, { value: "Driver", label: "Livreur" }, { value: "All", label: "Les deux" }]
const typeLabel = (v: unknown) => TYPES.find((t) => t.value === v)?.label ?? String(v ?? "")
const SEED = [
  { reason: "Délai de livraison trop long", userType: "User", status: "Active" },
  { reason: "Commande passée par erreur", userType: "User", status: "Active" },
  { reason: "Article en rupture de stock", userType: "Driver", status: "Active" },
  { reason: "Adresse de livraison inaccessible", userType: "Driver", status: "Active" },
  { reason: "Client injoignable", userType: "Driver", status: "Active" },
  { reason: "Autre raison", userType: "All", status: "Active" },
]

export default function CancelReasonsPage() {
  return (
    <CrudPage
      title="Motifs d'annulation" icon="⚙️" itemLabel="un motif" source="crud/cancel-reasons" seed={SEED} exportName="motifs-annulation"
      columns={[
        { key: "reason", label: "Motif", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "userType", label: "Applicable à", render: (r) => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{typeLabel(r.userType)}</span>, csv: (r) => typeLabel(r.userType) },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "reason", label: "Motif", required: true, full: true },
        { key: "userType", label: "Applicable à", type: "select", options: TYPES, required: true },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ userType: "User" }}
    />
  )
}
