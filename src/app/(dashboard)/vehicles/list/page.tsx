"use client"

import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import StatusBadge from "@/components/ui/StatusBadge"
import { useAction } from "@/components/admin/Feedback"
import { loadAccounts, useOptions } from "@/hooks/useAdminData"

const STATUSES = [{ value: "Pending", label: "À vérifier" }, { value: "Approved", label: "Approuvé" }, { value: "Rejected", label: "Rejeté" }]

export default function VehicleListPage() {
  const [drivers, setDrivers] = useState<{ value: string; label: string }[]>([])
  const types = useOptions("records/vehicle-types")
  const run = useAction()
  useEffect(() => { loadAccounts("driver").then(setDrivers).catch(() => {}) }, [])
  const driverName = (id: unknown) => drivers.find((d) => d.value === id)?.label.replace(/\s*\(.*\)$/, "") ?? "—"

  return (
    <CrudPage
      title="Véhicules des livreurs" icon="🚗" itemLabel="un véhicule" source="records/driver-vehicles" exportName="vehicules-livreurs"
      statusKey={null}
      columns={[
        { key: "driverId", label: "Livreur", render: (r) => <span className="font-medium text-gray-800">{driverName(r.driverId)}</span>, csv: (r) => driverName(r.driverId) },
        { key: "type", label: "Type" },
        { key: "brand", label: "Marque / Modèle", render: (r) => `${String(r.brand ?? "")} ${String(r.model ?? "")}`.trim() || "—" },
        { key: "plate", label: "Plaque", className: "px-4 py-3 font-mono text-gray-700" },
        { key: "year", label: "Année" },
        { key: "color", label: "Couleur" },
        { key: "status", label: "Statut", render: (r) => <StatusBadge status={String(r.status ?? "Pending")} /> },
      ]}
      rowActions={(r, api) => r.status === "Pending" ? (
        <>
          <button onClick={() => run(() => api.update(r.id, { status: "Approved" }), "Véhicule approuvé")} className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600" title="Approuver"><Check size={12} /></button>
          <button onClick={() => run(() => api.update(r.id, { status: "Rejected" }), "Véhicule rejeté")} className="rounded bg-orange-500 p-1.5 text-white hover:bg-orange-600" title="Rejeter"><X size={12} /></button>
        </>
      ) : null}
      fields={[
        { key: "driverId", label: "Livreur", type: "select", options: drivers, required: true },
        { key: "type", label: "Type", type: "select", options: types, required: true },
        { key: "brand", label: "Marque" },
        { key: "model", label: "Modèle" },
        { key: "plate", label: "Plaque d'immatriculation" },
        { key: "year", label: "Année", type: "number", min: 1990 },
        { key: "color", label: "Couleur" },
        { key: "status", label: "Statut", type: "select", options: STATUSES, required: true },
      ]}
      defaults={{ status: "Pending" }}
      fromForm={(v) => ({ ...v, plate: String(v.plate ?? "").toUpperCase() })}
    />
  )
}
