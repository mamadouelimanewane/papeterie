"use client"

import { useState } from "react"
import { Download, Clock } from "lucide-react"

const mockData = [
  { id: 1, name: "Mamadou Lamine Diallo", phone: "+221770000001", vehicle: "Moto", zone: "Dakar Centre", date: "2026-03-14", firstLogin: "07:30", lastLogout: "20:15", totalOnline: "9h 45m", deliveries: 14, status: "Offline" },
  { id: 2, name: "Ibrahima Fall", phone: "+221778881234", vehicle: "Voiture", zone: "Plateau", date: "2026-03-14", firstLogin: "09:00", lastLogout: "18:30", totalOnline: "7h 20m", deliveries: 8, status: "Offline" },
  { id: 3, name: "Ousmane Diallo", phone: "+221769874321", vehicle: "Moto", zone: "Parcelles Assainies", date: "2026-03-14", firstLogin: "08:15", lastLogout: null, totalOnline: "8h 10m", deliveries: 11, status: "Online" },
  { id: 4, name: "Cheikh Ndoye", phone: "+221775551234", vehicle: "Vélo", zone: "Médina", date: "2026-03-14", firstLogin: "10:00", lastLogout: "16:00", totalOnline: "6h 00m", deliveries: 5, status: "Offline" },
  { id: 5, name: "Aliou Mbaye", phone: "+221771234567", vehicle: "Moto", zone: "Guédiawaye", date: "2026-03-14", firstLogin: "06:45", lastLogout: null, totalOnline: "10h 30m", deliveries: 17, status: "En livraison" },
]

const statusColor: Record<string, string> = {
  "Online": "bg-green-100 text-green-700",
  "En livraison": "bg-orange-100 text-orange-700",
  "Offline": "bg-gray-100 text-gray-500",
}

export default function DriverOnlineTimePage() {
  const [dateFrom, setDateFrom] = useState("2026-03-14")
  const [dateTo, setDateTo] = useState("2026-03-14")

  const totalDeliveries = mockData.reduce((s, r) => s + r.deliveries, 0)
  const onlineCount = mockData.filter(r => r.status !== "Offline").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" /> Rapport temps en ligne — Livreurs
        </h1>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg">
          <Download size={14} /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Livreurs actifs aujourd'hui", value: mockData.length, color: "text-blue-600" },
          { label: "En ligne maintenant", value: onlineCount, color: "text-green-600" },
          { label: "Total livraisons", value: totalDeliveries, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date début</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date fin</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Filtrer</button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Livreur", "Téléphone", "Véhicule", "Zone", "Date", "1ère connexion", "Dernière déco.", "Temps total", "Livraisons", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockData.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.phone}</td>
                <td className="px-4 py-3 text-gray-600">{r.vehicle}</td>
                <td className="px-4 py-3 text-gray-600">{r.zone}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.date}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{r.firstLogin}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{r.lastLogout ?? <span className="text-green-600">En ligne</span>}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{r.totalOnline}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-700">{r.deliveries}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColor[r.status] ?? "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
