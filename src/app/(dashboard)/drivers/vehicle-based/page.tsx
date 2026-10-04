"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, RefreshCw } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import DriverDetailModal from "@/components/admin/DriverDetailModal"
import { adminFetch } from "@/lib/adminApi"

type Driver = { id: string; driverId: number; name: string; phone?: string | null; vehicleType?: string | null; status: string; approvalStatus: string }
const ICONS: Record<string, string> = { moto: "🏍️", bike: "🏍️", voiture: "🚗", car: "🚗", "vélo": "🚲", velo: "🚲", camionnette: "🚐" }
const icon = (t: string) => ICONS[t.toLowerCase().split(/[\s/]/)[0]] ?? "🚚"

export default function VehicleBasedDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    adminFetch<{ drivers: Driver[] }>("/api/drivers?perPage=100")
      .then((r) => setDrivers(r.drivers)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(() => {
    adminFetch<{ drivers: Driver[] }>("/api/drivers?perPage=100")
      .then((r) => setDrivers(r.drivers)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const groups = useMemo(() => {
    const m = new Map<string, Driver[]>()
    for (const d of drivers) { const k = d.vehicleType || "Non renseigné"; m.set(k, [...(m.get(k) ?? []), d]) }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [drivers])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">🚗 Livreurs par type de véhicule</h1>
        <button onClick={load} title="Actualiser" className="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !groups.length && !error && <p className="py-10 text-center text-sm text-gray-400">Aucun livreur enregistré.</p>}
      <div className="space-y-4">
        {groups.map(([type, list]) => {
          const online = list.filter((d) => d.status === "Online").length
          const open = expanded === type || (expanded === null && groups[0]?.[0] === type)
          return (
            <div key={type} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <button onClick={() => setExpanded(open ? "" : type)} className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon(type)}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{type}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{list.length} livreur(s) · {online} en ligne</div>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{list.length} livreurs</span>
              </button>
              {open && (
                <div className="overflow-x-auto border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>{["ID", "Nom", "Téléphone", "Approbation", "Statut", "Action"].map((h) => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {list.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-2 font-semibold text-blue-600">{d.driverId}</td>
                          <td className="px-4 py-2 font-medium text-gray-800">{d.name}</td>
                          <td className="px-4 py-2 text-gray-600">{d.phone ?? "—"}</td>
                          <td className="px-4 py-2"><StatusBadge status={d.approvalStatus} /></td>
                          <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                          <td className="px-4 py-2"><button onClick={() => setView(d.id)} title="Voir" className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600"><Eye size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <DriverDetailModal id={view} onClose={() => setView(null)} />
    </div>
  )
}
