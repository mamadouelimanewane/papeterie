"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Info, Search, RefreshCw, Eye } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

interface OrderDriver {
  name: string
  phone: string
}

interface OrderStore {
  name: string
  address: string | null
}

interface Order {
  id: string
  orderId: string
  invoiceId: string | null
  store: OrderStore
  userId: string | null
  driver: OrderDriver | null
  subtotal: number
  deliveryFee: number
  total: number
  earning: number
  paymentMethod: string
  paymentStatus: string
  items: unknown
  address: string | null
  status: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  All: "bg-gray-500",
  Pending: "bg-yellow-500",
  Processing: "bg-blue-500",
  Completed: "bg-green-500",
  Cancelled: "bg-red-500",
}

function exportCSV(orders: Order[]) {
  const headers = ["N°", "Commande", "Facture", "Boutique", "Client", "Livreur", "Sous-total", "Livraison", "Total", "Paiement", "Statut Paiement", "Gains", "Adresse", "Statut", "Date"]
  const rows = orders.map((o, i) => [
    i + 1,
    o.orderId,
    o.invoiceId ?? "",
    o.store.name,
    o.userId ?? "",
    o.driver?.name ?? "—",
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.paymentMethod,
    o.paymentStatus,
    o.earning,
    o.address ?? "",
    o.status,
    new Date(o.createdAt).toLocaleString("fr-FR"),
  ])
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `commandes_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const perPage = 10

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      if (!data.error) {
        setOrders(data.orders)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, dateFrom, dateTo])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function reset() {
    setSearch(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1)
  }

  const statusCounts: Record<string, number> = { All: total }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>🛒</span>
          <h1 className="text-lg font-semibold text-gray-700">Commandes — Mon École</h1>
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(orders)}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center"
            title="Exporter CSV"
          >
            <Download size={16} />
          </button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center" title="Aide">
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">N° commande / Client</label>
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-36" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Au</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-36" />
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={() => { setPage(1); fetchOrders() }} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Search size={16} /></button>
            <button onClick={reset} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", "Pending", "Processing", "Completed", "Cancelled"].map((key) => {
          const labels: Record<string, string> = { All: "Tous", Pending: "En attente", Processing: "En cours", Completed: "Livrées", Cancelled: "Annulées" }
          return (
            <button
              key={key}
              onClick={() => { setStatusFilter(key === "All" ? "" : key); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full text-white transition-opacity hover:opacity-90 ${statusColors[key]} ${statusFilter === (key === "All" ? "" : key) ? "ring-2 ring-offset-1 ring-current" : ""}`}
            >
              {labels[key]} <span className="bg-white/25 rounded-full px-1.5">{key === "All" ? total : "—"}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Commande", "Facture", "Boutique", "Livreur", "Sous-total", "Livraison", "Total (FCFA)", "Paiement", "Statut paiement", "Gains", "Adresse", "Statut", "Date", "Action"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={15} className="px-4 py-8 text-center text-gray-400 text-sm">Chargement...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={15} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune commande trouvée</td></tr>
            ) : (
              orders.map((order, i) => (
                <tr key={order.id} className="hover:bg-gray-50/80">
                  <td className="px-3 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-3 py-3">
                    <button className="text-indigo-600 font-semibold hover:underline" onClick={() => setSelectedOrder(order)}>
                      {order.orderId}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{order.invoiceId ?? "—"}</td>
                  <td className="px-3 py-3 text-gray-700 whitespace-nowrap">🏫 {order.store.name}</td>
                  <td className="px-3 py-3">
                    <div className="text-gray-700 whitespace-nowrap">{order.driver?.name ?? "—"}</div>
                    <div className="text-gray-400 text-xs">{order.driver?.phone ?? ""}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{order.subtotal.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3 text-gray-600">{order.deliveryFee.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3 font-semibold text-gray-800">{order.total.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{order.paymentMethod}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : order.paymentStatus === "En attente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-indigo-600 font-medium">{order.earning.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{order.address ?? "—"}</td>
                  <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-3">
                    <button className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600" onClick={() => setSelectedOrder(order)} title="Voir détails">
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-3 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Affichage de {orders.length > 0 ? (page - 1) * perPage + 1 : 0} à {Math.min(page * perPage, total)} sur {total} entrées</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + idx
              return (
                <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded border ${page === p ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-200 hover:bg-gray-50"}`}>{p}</button>
              )
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Commande {selectedOrder.orderId}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                ["Facture", selectedOrder.invoiceId ?? "—"],
                ["Boutique", selectedOrder.store.name],
                ["Client ID", selectedOrder.userId ?? "—"],
                ["Livreur", selectedOrder.driver ? `${selectedOrder.driver.name} (${selectedOrder.driver.phone})` : "Non assigné"],
                ["Sous-total", `${selectedOrder.subtotal.toLocaleString("fr-FR")} FCFA`],
                ["Frais livraison", `${selectedOrder.deliveryFee.toLocaleString("fr-FR")} FCFA`],
                ["Total", `${selectedOrder.total.toLocaleString("fr-FR")} FCFA`],
                ["Paiement", `${selectedOrder.paymentMethod} — ${selectedOrder.paymentStatus}`],
                ["Gains plateforme", `${selectedOrder.earning.toLocaleString("fr-FR")} FCFA`],
                ["Adresse", selectedOrder.address ?? "—"],
                ["Statut", selectedOrder.status],
                ["Date", new Date(selectedOrder.createdAt).toLocaleString("fr-FR")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
