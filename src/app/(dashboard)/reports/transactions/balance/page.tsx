"use client"

import { Download } from "lucide-react"

const mockBalance = [
  { user: "Fatou Diallo", type: "Utilisateur", credits: 500, debits: 200, balance: 300 },
  { user: "Moussa Sarr", type: "Utilisateur", credits: 1000, debits: 0, balance: 1000 },
  { user: "Mamadou Lamine Diallo", type: "Livreur", credits: 5000, debits: 0, balance: 8200 },
  { user: "Ibrahima Sarr", type: "Livreur", credits: 22000, debits: 0, balance: 22000 },
]

export default function BalanceReportPage() {
  const totalCredits = mockBalance.reduce((s, r) => s + r.credits, 0)
  const totalDebits = mockBalance.reduce((s, r) => s + r.debits, 0)
  const totalBalance = mockBalance.reduce((s, r) => s + r.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">📊 Rapport de solde</h1>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"><Download size={14} /> Exporter</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total crédits", value: `${totalCredits.toLocaleString()} FCFA`, color: "bg-green-500" },
          { label: "Total débits", value: `${totalDebits.toLocaleString()} FCFA`, color: "bg-red-500" },
          { label: "Solde net", value: `${totalBalance.toLocaleString()} FCFA`, color: "bg-cyan-500" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`w-2 h-8 ${k.color} rounded-full mb-3`} />
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["Utilisateur", "Type", "Crédits (FCFA)", "Débits (FCFA)", "Solde (FCFA)"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockBalance.map((r) => (
              <tr key={r.user} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-800">{r.user}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full font-medium ${r.type === "Livreur" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{r.type}</span></td>
                <td className="px-4 py-3 text-green-600 font-semibold">{r.credits.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-600 font-semibold">{r.debits.toLocaleString()}</td>
                <td className="px-4 py-3 text-cyan-600 font-bold">{r.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
