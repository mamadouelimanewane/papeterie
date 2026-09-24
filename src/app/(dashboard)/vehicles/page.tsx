"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { fmtDate } from "@/lib/adminApi"

const SEED = [
  { name: "Moto", icon: "🏍️", capacity: 1, status: "Active" },
  { name: "Voiture", icon: "🚗", capacity: 4, status: "Active" },
  { name: "Vélo", icon: "🚲", capacity: 1, status: "Active" },
  { name: "Camionnette", icon: "🚐", capacity: 8, status: "Inactive" },
]

export default function VehiclesPage() {
  return (
    <CrudPage
      title="Types de véhicules" icon="🚗" itemLabel="un type de véhicule" source="records/vehicle-types" seed={SEED} exportName="types-vehicules"
      columns={[
        { key: "icon", label: "Icône", className: "px-4 py-3 text-2xl" },
        { key: "name", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "capacity", label: "Capacité (colis)" },
        { key: "status", label: "Statut" },
        { key: "createdAt", label: "Créé le", render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.createdAt)}</span> },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "icon", label: "Icône (emoji)", placeholder: "🏍️" },
        { key: "capacity", label: "Capacité", type: "number", min: 1 },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      fromForm={(v) => ({ ...v, capacity: v.capacity === "" || v.capacity == null ? null : Number(v.capacity) })}
    />
  )
}
