"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Pièce", symbol: "pcs", status: "Active" },
  { name: "Paquet", symbol: "pqt", status: "Active" },
  { name: "Rame", symbol: "rame", status: "Active" },
  { name: "Kilogramme", symbol: "kg", status: "Active" },
  { name: "Gramme", symbol: "g", status: "Active" },
  { name: "Litre", symbol: "L", status: "Inactive" },
]

export default function WeightUnitsPage() {
  return (
    <CrudPage
      title="Unités de mesure" icon="⚖️" itemLabel="une unité" source="records/weight-units" seed={SEED} exportName="unites"
      columns={[
        { key: "name", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "symbol", label: "Symbole", className: "px-4 py-3 font-mono text-gray-600" },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "symbol", label: "Symbole", required: true },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
    />
  )
}
