"use client"

import { useState } from "react"
import { Check, X, Eye } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

const mockCashout = [
  { id: 1, store: "Marché Keur Massar", email: "marchekeurmassar@gmail.com", amount: 50000, method: "Virement bancaire", account: "SN08 SN0...1234", requestedAt: "2026-03-15 09:00", status: "Pending" },
  { id: 2, store: "Marché Rufisque", email: "marcherufisque25@gmail.com", amount: 30000, method: "Orange Money", account: "78 738 65 65", requestedAt: "2026-03-13 14:00", status: "Completed" },
  { id: 3, store: "France Mangasin test", email: "ndame.kital@lndugumi.com", amount: 1800, method: "Wave", account: "06 822 58 08", requestedAt: "2026-03-10 11:00", status: "Completed" },
]

export default function CashoutStoresPage() {
  const [requests] = useState(mockCashout)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><span>🏪</span> Demandes de retrait — Magasins</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "En attente", count: requests.filter(r => r.status === "Pending").length, color: "bg-yellow-500" },
          { label: "Approuvées", count: requests.filter(r => r.status === "Completed").length, color: "bg-green-500" },
          { label: "Rejetées", count: requests.filter(r => r.status === "Rejected").length, color: "bg-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-3 h-10 ${s.color} rounded-full`} />
            <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-800">{s.count}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["N°", "Magasin", "Montant (FCFA)", "Méthode", "Compte", "Date demande", "Statut", "Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{r.store}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{r.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{r.method}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.account}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.requestedAt}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 flex gap-1">
                  <button className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="Voir"><Eye size={12} /></button>
                  {r.status === "Pending" && <>
                    <button className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600" title="Approuver"><Check size={12} /></button>
                    <button className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Rejeter"><X size={12} /></button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
