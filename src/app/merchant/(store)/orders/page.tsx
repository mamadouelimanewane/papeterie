"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, RefreshCw, X, Loader2, Phone, MapPin, KeyRound, Truck } from "lucide-react"
import { merchantFetch, fmtFcfa, fmtWhen, statusOf, itemsOf, itemsSummary, customerOf, phoneOf } from "../MerchantContext"

interface Order {
  id: string
  orderId: string
  total: number
  subtotal: number
  deliveryFee: number
  status: string
  paymentMethod: string
  paymentStatus: string
  items: unknown
  address: string | null
  notes: string | null
  pickupOtp: string | null
  driverId: string | null
  createdAt: string
  driver: { name: string; phone: string | null } | null
}

const TABS = [
  { value: "", label: "Toutes" },
  { value: "Pending", label: "En attente" },
  { value: "Accepted", label: "Livreur assigné" },
  { value: "Processing", label: "En livraison" },
  { value: "Delivered", label: "Livrées" },
  { value: "Cancelled", label: "Annulées" },
]

export default function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (tab) params.set("status", tab)
      if (query) params.set("search", query)
      setOrders(await merchantFetch<Order[]>(`/api/merchant/orders?${params}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [tab, query])
  useEffect(() => { load() }, [load])

  const cancel = async (o: Order) => {
    if (!window.confirm(`Annuler la commande ${o.orderId} ? Le stock des articles sera restitué.`)) return
    setCancelling(true)
    try {
      const updated = await merchantFetch<Order>(`/api/merchant/orders/${o.id}`, { method: "PATCH", body: { action: "cancel" } })
      setSelected(updated)
      load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erreur")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Commandes</h1>
        <p className="text-sm text-gray-500">Commandes passées auprès de votre boutique</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-colors ${
              tab === t.value ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()) }} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° de commande, client, adresse…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button type="submit" className="px-4 bg-indigo-600 text-white rounded-xl text-sm">Rechercher</button>
        <button type="button" onClick={() => { setSearch(""); setQuery(""); load() }} title="Actualiser"
          className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
          <RefreshCw size={16} />
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Commande", "Client", "Articles", "Montant", "Paiement", "Statut", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 size={22} className="animate-spin text-indigo-500 mx-auto" /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucune commande</td></tr>
            ) : (
              orders.map((o) => {
                const st = statusOf(o.status)
                return (
                  <tr key={o.id} onClick={() => setSelected(o)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{o.orderId}</td>
                    <td className="px-4 py-3 text-gray-700">{customerOf(o.notes)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{itemsSummary(o.items)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{fmtFcfa(o.total)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{o.paymentMethod} · {o.paymentStatus}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtWhen(o.createdAt)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Commande {selected.orderId}</h2>
                <p className="text-xs text-gray-400">{fmtWhen(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${statusOf(selected.status).cls}`}>{statusOf(selected.status).label}</span>
                <span className="text-xs text-gray-500">{selected.paymentMethod} · {selected.paymentStatus}</span>
              </div>

              <div className="space-y-1.5">
                <div className="font-medium text-gray-800">{customerOf(selected.notes)}</div>
                {phoneOf(selected.notes) && (
                  <a href={`tel:${phoneOf(selected.notes)}`} className="flex items-center gap-2 text-indigo-600 text-xs"><Phone size={13} />{phoneOf(selected.notes)}</a>
                )}
                {selected.address && <div className="flex items-start gap-2 text-xs text-gray-500"><MapPin size={13} className="mt-0.5" />{selected.address}</div>}
              </div>

              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                {itemsOf(selected.items).map((it, i) => (
                  <div key={i} className="px-3 py-2 flex justify-between gap-3">
                    <span className="text-gray-700">{it.name ?? "Article"} <span className="text-gray-400">x{it.quantity ?? 1}</span></span>
                    <span className="text-gray-600 whitespace-nowrap">{fmtFcfa((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                  </div>
                ))}
                <div className="px-3 py-2 flex justify-between text-xs text-gray-500"><span>Livraison</span><span>{fmtFcfa(selected.deliveryFee)}</span></div>
                <div className="px-3 py-2 flex justify-between font-semibold text-gray-800"><span>Total</span><span>{fmtFcfa(selected.total)}</span></div>
              </div>

              {selected.driver && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-xl p-3">
                  <Truck size={14} className="text-blue-500" /> Livreur : {selected.driver.name}{selected.driver.phone ? ` · ${selected.driver.phone}` : ""}
                </div>
              )}
              {selected.pickupOtp && !["Delivered", "Completed", "Cancelled", "Annule"].includes(selected.status) && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 rounded-xl p-3">
                  <KeyRound size={14} /> Code de retrait à communiquer au livreur : <b className="text-base tracking-widest">{selected.pickupOtp}</b>
                </div>
              )}
              {selected.notes && <p className="text-xs text-gray-400 break-words">Notes : {selected.notes}</p>}
            </div>
            {selected.status === "Pending" && !selected.driverId && (
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={() => cancel(selected)} disabled={cancelling}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  {cancelling && <Loader2 size={14} className="animate-spin" />} Annuler la commande
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
