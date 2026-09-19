"use client"

import { Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Oct", earning: 30000 },
  { month: "Nov", earning: 25000 },
  { month: "Déc", earning: 50000 },
  { month: "Jan", earning: 40000 },
  { month: "Fév", earning: 60000 },
  { month: "Mar", earning: 75000 },
]

const topStores = [
  { name: "Marché Keur Massar", orders: 198, earning: 220770 },
  { name: "Marché Rufisque", orders: 89, earning: 93544 },
  { name: "France Mangasin test", orders: 3, earning: 1866 },
]

export default function StoresEarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">🏪 Gains magasins</h1>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"><Download size={14} /> Exporter</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total gains magasins", value: "316 180 FCFA", color: "bg-orange-500" },
          { label: "Total commandes", value: "290", color: "bg-green-500" },
          { label: "Magasins actifs", value: "3", color: "bg-purple-500" },
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
            <Bar dataKey="earning" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Top magasins</h2>
        <div className="space-y-3">
          {topStores.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  <span className="text-sm font-bold text-gray-800">{s.earning.toLocaleString()} FCFA</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full" style={{ width: `${(s.earning / 220770) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
