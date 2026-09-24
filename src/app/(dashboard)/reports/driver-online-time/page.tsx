"use client"

import { Clock } from "lucide-react"
import ReportView from "@/components/admin/ReportView"
import { fmtDate } from "@/lib/adminApi"

const STATUS: Record<string, string> = { Online: "bg-green-100 text-green-700", Busy: "bg-orange-100 text-orange-700", Offline: "bg-gray-100 text-gray-500" }
const LABEL: Record<string, string> = { Online: "En ligne", Busy: "En livraison", Offline: "Hors ligne" }

export default function DriverOnlineTimePage() {
  return (
    <ReportView
      title="Activité des livreurs" icon={<Clock size={18} className="text-blue-600" />} kind="driver-activity" exportName="activite-livreurs"
      searchPlaceholder="Nom, zone..."
      columns={[
        { key: "name", label: "Livreur", render: (r) => <div><div className="font-medium text-gray-800">{String(r.name)}</div><div className="text-xs text-gray-500">{String(r.phone ?? "")}</div></div> },
        { key: "vehicleType", label: "Véhicule" },
        { key: "serviceArea", label: "Zone" },
        { key: "firstActivity", label: "Première course", render: (r) => <span className="text-xs">{fmtDate(r.firstActivity)}</span>, csv: (r) => fmtDate(r.firstActivity) },
        { key: "lastActivity", label: "Dernière activité", render: (r) => <span className="text-xs">{fmtDate(r.lastActivity)}</span>, csv: (r) => fmtDate(r.lastActivity) },
        { key: "deliveries", label: "Livraisons", render: (r) => <span className="font-semibold text-orange-600">{String(r.deliveries)}</span> },
        { key: "inProgress", label: "En cours" },
        { key: "status", label: "Statut", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[String(r.status)] ?? STATUS.Offline}`}>{LABEL[String(r.status)] ?? String(r.status)}</span>, csv: (r) => LABEL[String(r.status)] ?? r.status },
      ]}
      kpis={(rows) => [
        { label: "Livreurs approuvés", value: rows.length, color: "bg-blue-500" },
        { label: "En ligne maintenant", value: rows.filter((r) => r.status !== "Offline").length, color: "bg-green-500" },
        { label: "Livraisons sur la période", value: rows.reduce((s, r) => s + Number(r.deliveries), 0), color: "bg-orange-500" },
      ]}
    />
  )
}
