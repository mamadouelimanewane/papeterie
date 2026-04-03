"use client"

import { useState } from "react"
import { Download, Info, Search, RefreshCw, Eye } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

const mockOrders = [
  { id: 3253, invoiceId: "INV-3253", store: "Mon École", user: "Fatou Diallo",    userPhone: "+221776543210", driver: "Bassirou Diao",          driverPhone: "+221764082948", product: "Cahier 100p petits carreaux x3, Stylos BIC x1, Règle 30cm x1", items: 5,  subtotal: 4200,  deliveryFee: 500,  total: 4700,  payment: "Wave",         paymentStatus: "Payé",       earning: 470,  address: "Dakar, Sénégal",   status: "Completed",  createdAt: "2026-03-15 10:30:00" },
  { id: 3252, invoiceId: "INV-3252", store: "Mon École", user: "Oumar Ba",        userPhone: "+221765432109", driver: "—",                      driverPhone: "—",            product: "Livre Maths Terminale S x1, Annales Bac x2, Fiche révision x1", items: 4,  subtotal: 12500, deliveryFee: 500,  total: 13000, payment: "Orange Money", paymentStatus: "En attente", earning: 1300, address: "Rufisque, Sénégal", status: "Processing", createdAt: "2026-03-15 09:45:00" },
  { id: 3251, invoiceId: "INV-3251", store: "Mon École", user: "Aissatou Ndiaye", userPhone: "+221754321098", driver: "—",                      driverPhone: "—",            product: "Cartable maternelle CI x1, Crayons couleur 24 x1",              items: 2,  subtotal: 11000, deliveryFee: 500,  total: 11500, payment: "Cash",         paymentStatus: "Payé",       earning: 1150, address: "Dakar, Sénégal",   status: "Pending",    createdAt: "2026-03-15 09:00:00" },
  { id: 3250, invoiceId: "INV-3250", store: "Mon École", user: "Moussa Sarr",     userPhone: "+221743210987", driver: "Mamadou Lamine Diallo",  driverPhone: "+221770000001", product: "Calculatrice Casio FX-82 x1, Compas x2, Livres 3ème x3, Équerre x2", items: 8, subtotal: 25600, deliveryFee: 1000, total: 26600, payment: "Wave",         paymentStatus: "Payé",       earning: 2660, address: "Pikine, Sénégal",  status: "Completed",  createdAt: "2026-03-14 18:15:00" },
  { id: 3249, invoiceId: "INV-3249", store: "Mon École", user: "Cheikh Diop",     userPhone: "+221732109876", driver: "—",                      driverPhone: "—",            product: "Cahiers de brouillon x10",                                     items: 1,  subtotal: 3000,  deliveryFee: 500,  total: 3500,  payment: "Cash",         paymentStatus: "Remboursé",  earning: 0,    address: "Rufisque, Sénégal", status: "Cancelled",  createdAt: "2026-03-14 15:00:00" },
  { id: 3248, invoiceId: "INV-3248", store: "Mon École", user: "Rokhaya Sow",     userPhone: "+221771234567", driver: "Ibrahima Sarr",          driverPhone: "+221776543210", product: "Sac lycée 40L x1, Livres 2nde Français x1, Maths x1, SVT x1, Kit géométrie x1", items: 5, subtotal: 33200, deliveryFee: 800, total: 34000, payment: "Orange Money", paymentStatus: "Payé", earning: 3400, address: "Dakar, Sénégal", status: "Completed", createdAt: "2026-03-14 12:00:00" },
  { id: 3247, invoiceId: "INV-3247", store: "Mon École", user: "Aminata Fall",    userPhone: "+221770987654", driver: "Pape Diallo",             driverPhone: "+221773456789", product: "Dictionnaire Larousse x1, Stylos plume x3, Encre x2",          items: 6,  subtotal: 9800,  deliveryFee: 500,  total: 10300, payment: "Wave",         paymentStatus: "Payé",       earning: 1030, address: "Guédiawaye, Sénégal", status: "Completed", createdAt: "2026-03-14 10:00:00" },
  { id: 3246, invoiceId: "INV-3246", store: "Mon École", user: "Ibrahima Ndiaye", userPhone: "+221774321876", driver: "—",                      driverPhone: "—",            product: "Trousse garnie primaire x2, Cahier dessin A4 x3",              items: 5,  subtotal: 6400,  deliveryFee: 500,  total: 6900,  payment: "Orange Money", paymentStatus: "Payé",       earning: 690,  address: "Parcelles Assainies, Sénégal", status: "Completed", createdAt: "2026-03-13 16:30:00" },
]

const statusColors: Record<string, string> = {
  All: "bg-gray-500", Pending: "bg-yellow-500", Processing: "bg-blue-500", Completed: "bg-green-500", Cancelled: "bg-red-500",
}

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [storeFilter, setStoreFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 10

  const stores = Array.from(new Set(mockOrders.map((o) => o.store)))

  const filtered = mockOrders.filter((o) => {
    const matchSearch = !search || String(o.id).includes(search) || o.store.toLowerCase().includes(search.toLowerCase()) || o.user.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    const matchStore = !storeFilter || o.store === storeFilter
    const matchProduct = !productFilter || o.product.toLowerCase().includes(productFilter.toLowerCase())
    return matchSearch && matchStatus && matchStore && matchProduct
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  function reset() { setSearch(""); setStatusFilter(""); setStoreFilter(""); setProductFilter(""); setDateFrom(""); setDateTo("") }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>🛒</span>
          <h1 className="text-lg font-semibold text-gray-700">Commandes — Mon École</h1>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Exporter CSV"><Download size={16} /></button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center" title="Aide"><Info size={16} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">N° commande / Client</label>
            <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Produit</label>
            <input placeholder="Nom du produit" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Boutique</label>
            <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 text-gray-500 focus:outline-none">
              <option value="">-- Toutes les boutiques --</option>
              {stores.map((s) => <option key={s}>{s}</option>)}
            </select>
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
            <button className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600" title="Rechercher"><Search size={16} /></button>
            <button onClick={reset} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600" title="Réinitialiser"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", "Pending", "Processing", "Completed", "Cancelled"].map((key) => {
          const labels: Record<string, string> = { All: "Tous", Pending: "En attente", Processing: "En cours", Completed: "Livrées", Cancelled: "Annulées" }
          const count = key === "All" ? mockOrders.length : mockOrders.filter((o) => o.status === key).length
          return (
            <button key={key} onClick={() => { setStatusFilter(key === "All" ? "" : key); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full text-white transition-opacity hover:opacity-90 ${statusColors[key]} ${statusFilter === (key === "All" ? "" : key) ? "ring-2 ring-offset-1 ring-current" : ""}`}>
              {labels[key]} <span className="bg-white/25 rounded-full px-1.5">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "N° commande", "Facture", "Boutique", "Client", "Livreur", "Produits", "Sous-total", "Livraison", "Total (FCFA)", "Paiement", "Statut paiement", "Gains", "Adresse", "Statut", "Date", "Action"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((order, i) => (
              <tr key={order.id} className="hover:bg-gray-50/80">
                <td className="px-3 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                <td className="px-3 py-3">
                  <button className="text-indigo-600 font-semibold hover:underline" onClick={() => setSelectedOrder(order)}>
                    #{order.id}
                  </button>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500">{order.invoiceId}</td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">🏫 {order.store}</td>
                <td className="px-3 py-3">
                  <div className="text-gray-800 font-medium whitespace-nowrap">{order.user}</div>
                  <div className="text-gray-400 text-xs">{order.userPhone}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-gray-700 whitespace-nowrap">{order.driver}</div>
                  <div className="text-gray-400 text-xs">{order.driverPhone !== "—" ? order.driverPhone : ""}</div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 max-w-[150px]">
                  <div className="truncate" title={order.product}>{order.product}</div>
                  <div className="text-gray-400">{order.items} article(s)</div>
                </td>
                <td className="px-3 py-3 text-gray-700">{order.subtotal.toLocaleString()}</td>
                <td className="px-3 py-3 text-gray-600">{order.deliveryFee.toLocaleString()}</td>
                <td className="px-3 py-3 font-semibold text-gray-800">{order.total.toLocaleString()}</td>
                <td className="px-3 py-3 text-xs text-gray-600">{order.payment}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : order.paymentStatus === "En attente" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-3 py-3 text-indigo-600 font-medium">{order.earning.toLocaleString()}</td>
                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{order.address}</td>
                <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{order.createdAt}</td>
                <td className="px-3 py-3">
                  <button className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600" onClick={() => setSelectedOrder(order)} title="Voir détails"><Eye size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-3 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Affichage de {(page - 1) * perPage + 1} à {Math.min(page * perPage, filtered.length)} sur {filtered.length} entrées</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + idx
              return <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded border ${page === p ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-200 hover:bg-gray-50"}`}>{p}</button>
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">Commande #{selectedOrder.id} — {selectedOrder.store}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                ["Facture", selectedOrder.invoiceId],
                ["Boutique", selectedOrder.store],
                ["Client", `${selectedOrder.user} (${selectedOrder.userPhone})`],
                ["Livreur", selectedOrder.driver !== "—" ? `${selectedOrder.driver} (${selectedOrder.driverPhone})` : "Non assigné"],
                ["Produits", selectedOrder.product],
                ["Articles", String(selectedOrder.items)],
                ["Sous-total", `${selectedOrder.subtotal.toLocaleString()} FCFA`],
                ["Frais livraison", `${selectedOrder.deliveryFee.toLocaleString()} FCFA`],
                ["Total", `${selectedOrder.total.toLocaleString()} FCFA`],
                ["Paiement", `${selectedOrder.payment} — ${selectedOrder.paymentStatus}`],
                ["Gains plateforme", `${selectedOrder.earning.toLocaleString()} FCFA`],
                ["Adresse", selectedOrder.address],
                ["Statut", selectedOrder.status],
                ["Date", selectedOrder.createdAt],
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
