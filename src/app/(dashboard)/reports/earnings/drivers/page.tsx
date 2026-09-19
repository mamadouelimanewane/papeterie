"use client"

import { Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Oct", earning: 12000 },
  { month: "Nov", earning: 18000 },
  { month: "Déc", earning: 25000 },
  { month: "Jan", earning: 20000 },
  { month: "Fév", earning: 32000 },
  { month: "Mar", earning: 38000 },
]

const topDrivers = [
  { name: "Ibrahima Sarr", orders: 45, earning: 22500 },
  { name: "Mamadou Lamine Diallo", orders: 12, earning: 6000 },
  { name: "Bassirou Diao", orders: 0, earning: 0 },
]

export default function DriversEarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">🚗 Gains livreurs</h1>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg">
          <Download size={14} /> Exporter
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total gains livreurs", value: "45 000 FCFA", color: "bg-blue-500" },
          { label: "Livraisons effectuées", value: "57", color: "bg-green-500" },
          { label: "Livreurs actifs", value: "3", color: "bg-purple-500" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`w-2 h-8 ${k.color} rounded-full mb-3`} />
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Gains mensuels (FCFA)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} FCFA`, "Gains"]} />
            <Bar dataKey="earning" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Top livreurs</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{["Livreur", "Commandes", "Gains (FCFA)"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {topDrivers.map((d, i) => (
              <tr key={d.name} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-800">{i + 1}. {d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.orders}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{d.earning.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
