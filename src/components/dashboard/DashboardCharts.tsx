"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

interface ChartDataPoint {
  name: string
  commandes: number
  revenus: number
}

interface CategoryStat {
  name: string
  value: number
  color: string
}

interface Props {
  chartData?: ChartDataPoint[]
  categoryStats?: CategoryStat[]
}

const fallbackChartData: ChartDataPoint[] = [
  { name: "J-6", commandes: 0, revenus: 0 },
  { name: "J-5", commandes: 0, revenus: 0 },
  { name: "J-4", commandes: 0, revenus: 0 },
  { name: "J-3", commandes: 0, revenus: 0 },
  { name: "J-2", commandes: 0, revenus: 0 },
  { name: "J-1", commandes: 0, revenus: 0 },
  { name: "Auj.", commandes: 0, revenus: 0 },
]

const fallbackCategories: CategoryStat[] = [
  { name: "Livres", value: 0, color: "#4F46E5" },
  { name: "Cahiers", value: 0, color: "#06B6D4" },
  { name: "Art", value: 0, color: "#10B981" },
  { name: "Calcul", value: 0, color: "#F59E0B" },
]

export default function DashboardCharts({ chartData, categoryStats }: Props) {
  const data = chartData ?? fallbackChartData
  const cats = categoryStats ?? fallbackCategories

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-6 flex items-center gap-2">
          📈 Commandes & Revenus (7 jours)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} yAxisId="left" />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                formatter={(value: number, name: string) => [
                  name === "revenus" ? `${value.toLocaleString("fr-FR")} FCFA` : value,
                  name === "commandes" ? "Commandes" : "Revenus",
                ]}
              />
              <Line yAxisId="left" type="monotone" dataKey="commandes" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: "#4F46E5" }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenus" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-6 flex items-center gap-2">
          📦 Parts par Catégorie
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {cats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, "Produits"]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
