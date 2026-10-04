"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS, DAYS } from "@/components/admin/FormModal"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const SEED = [
  { label: "Matin", startTime: "08:00", endTime: "12:00", daysOfWeek: ALL_DAYS, maxOrders: 30, status: "Active" },
  { label: "Midi", startTime: "12:00", endTime: "14:00", daysOfWeek: ALL_DAYS, maxOrders: 15, status: "Active" },
  { label: "Après-midi", startTime: "14:00", endTime: "18:00", daysOfWeek: ALL_DAYS, maxOrders: 30, status: "Active" },
  { label: "Soir", startTime: "18:00", endTime: "21:00", daysOfWeek: [0, 1, 2, 3, 4, 5], maxOrders: 20, status: "Active" },
]
const days = (v: unknown) => {
  const d = Array.isArray(v) ? (v as number[]) : []
  return d.length === 7 ? "Tous les jours" : d.length === 0 ? "—" : d.map((i) => DAYS[i]).join(", ")
}

export default function ServiceTimeSlotsPage() {
  return (
    <CrudPage
      title="Créneaux de livraison" icon="🕐" itemLabel="un créneau" source="crud/time-slots" seed={SEED} exportName="creneaux"
      description="Plages horaires proposées au client pour la livraison."
      columns={[
        { key: "label", label: "Nom", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "startTime", label: "Début" },
        { key: "endTime", label: "Fin" },
        { key: "daysOfWeek", label: "Jours", render: (r) => <span className="text-xs">{days(r.daysOfWeek)}</span>, csv: (r) => days(r.daysOfWeek) },
        { key: "maxOrders", label: "Commandes max", render: (r) => String(r.maxOrders ?? "Illimité") },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "label", label: "Nom", required: true },
        { key: "maxOrders", label: "Commandes max", type: "number", min: 1, help: "Vide = illimité" },
        { key: "startTime", label: "Début", type: "time", required: true },
        { key: "endTime", label: "Fin", type: "time", required: true },
        { key: "daysOfWeek", label: "Jours", type: "days" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ daysOfWeek: ALL_DAYS }}
    />
  )
}
