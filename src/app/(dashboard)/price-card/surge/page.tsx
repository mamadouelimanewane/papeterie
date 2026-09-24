"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS, DAYS } from "@/components/admin/FormModal"
import { useOptions } from "@/hooks/useAdminData"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const SEED = [
  { name: "Heure de pointe matin", startTime: "07:00", endTime: "09:00", multiplier: 1.5, serviceArea: "Dakar", daysOfWeek: [0, 1, 2, 3, 4], status: "Active" },
  { name: "Heure de pointe soir", startTime: "17:00", endTime: "20:00", multiplier: 1.8, serviceArea: "Dakar", daysOfWeek: [0, 1, 2, 3, 4], status: "Active" },
  { name: "Nuit", startTime: "22:00", endTime: "05:00", multiplier: 2, serviceArea: "", daysOfWeek: ALL_DAYS, status: "Inactive" },
]
const days = (v: unknown) => {
  const d = Array.isArray(v) ? (v as number[]) : []
  return d.length === 7 ? "Tous les jours" : d.length === 0 ? "—" : d.map((i) => DAYS[i]).join(", ")
}

export default function SurgePricingPage() {
  const zones = useOptions("crud/service-areas")
  return (
    <CrudPage
      title="Tarif dynamique (majoration)" icon="📈" itemLabel="une majoration" source="crud/surge" seed={SEED} exportName="majorations"
      description="Coefficient appliqué aux frais de livraison sur certaines plages horaires."
      columns={[
        { key: "name", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "startTime", label: "De" },
        { key: "endTime", label: "À" },
        { key: "daysOfWeek", label: "Jours", render: (r) => <span className="text-xs">{days(r.daysOfWeek)}</span>, csv: (r) => days(r.daysOfWeek) },
        { key: "multiplier", label: "Multiplicateur", render: (r) => <span className="font-bold text-orange-600">×{String(r.multiplier)}</span> },
        { key: "serviceArea", label: "Zone", render: (r) => String(r.serviceArea || "Toutes") },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "multiplier", label: "Multiplicateur", type: "number", step: "0.1", min: 1, required: true },
        { key: "startTime", label: "Heure de début", type: "time", required: true },
        { key: "endTime", label: "Heure de fin", type: "time", required: true },
        { key: "daysOfWeek", label: "Jours", type: "days" },
        { key: "serviceArea", label: "Zone", type: "select", options: zones, help: "Vide = toutes les zones" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ multiplier: 1.5, daysOfWeek: ALL_DAYS }}
    />
  )
}
