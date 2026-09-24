"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Marqueur client", type: "User", color: "#4CAF50", status: "Active" },
  { name: "Marqueur livreur", type: "Driver", color: "#2196F3", status: "Active" },
  { name: "Marqueur boutique", type: "Store", color: "#FF9800", status: "Active" },
  { name: "Marqueur destination", type: "Destination", color: "#F44336", status: "Active" },
]

export default function MapMarkersPage() {
  return (
    <CrudPage
      title="Marqueurs carte" icon="📍" itemLabel="un marqueur" source="records/marker-styles" seed={SEED} exportName="marqueurs-carte"
      description="Couleur des repères affichés sur les cartes (suivi livreur, carte de chaleur)."
      columns={[
        { key: "name", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "type", label: "Type" },
        { key: "color", label: "Couleur", render: (r) => (
          <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full border border-gray-200" style={{ background: String(r.color ?? "#ccc") }} /><span className="font-mono text-xs">{String(r.color ?? "")}</span></span>
        ) },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "type", label: "Type", type: "select", required: true, options: [
          { value: "User", label: "Client" }, { value: "Driver", label: "Livreur" }, { value: "Store", label: "Boutique" }, { value: "Destination", label: "Destination" },
        ] },
        { key: "color", label: "Couleur", type: "color" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ color: "#4F46E5", type: "User" }}
    />
  )
}
