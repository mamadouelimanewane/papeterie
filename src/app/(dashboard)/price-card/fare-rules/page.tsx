"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { useOptions } from "@/hooks/useAdminData"

const SEED = [
  { name: "Livraison standard Dakar", serviceArea: "Dakar", baseFare: 500, perKm: 100, minFare: 500, status: "Active" },
  { name: "Livraison Rufisque", serviceArea: "Rufisque", baseFare: 800, perKm: 150, minFare: 800, status: "Active" },
  { name: "Livraison express", serviceArea: "", baseFare: 1500, perKm: 200, minFare: 1500, status: "Inactive" },
]
const n = (v: unknown) => Number(v ?? 0).toLocaleString("fr-FR")

export default function FareRulesPage() {
  const zones = useOptions("crud/service-areas")
  return (
    <CrudPage
      title="Règles tarifaires" icon="💳" itemLabel="une règle tarifaire" source="crud/fare-rules" seed={SEED} exportName="regles-tarifaires"
      description="Frais de livraison : prix de base + prix au kilomètre, avec un minimum."
      columns={[
        { key: "name", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "serviceArea", label: "Zone", render: (r) => String(r.serviceArea || "Toutes") },
        { key: "baseFare", label: "Prix de base (FCFA)", render: (r) => n(r.baseFare) },
        { key: "perKm", label: "Prix/km (FCFA)", render: (r) => n(r.perKm) },
        { key: "minFare", label: "Minimum (FCFA)", render: (r) => n(r.minFare) },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "serviceArea", label: "Zone", type: "select", options: zones, help: "Vide = toutes les zones" },
        { key: "baseFare", label: "Prix de base (FCFA)", type: "number", min: 0, required: true },
        { key: "perKm", label: "Prix par km (FCFA)", type: "number", min: 0, required: true },
        { key: "minFare", label: "Minimum (FCFA)", type: "number", min: 0 },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
    />
  )
}
