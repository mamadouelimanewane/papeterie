"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Download, Info, Edit, Eye, Trash2, Bell, CreditCard, FileText, MapPin, Smartphone, LogOut, RefreshCw, Search, ToggleLeft, Phone, PhoneOff, Star } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

interface DriverDoc {
  id: string
  type: string
  label: string
  status: string
}

interface Driver {
  id: string
  driverId: number
  name: string
  phone: string | null
  email: string
  serviceArea: string | null
  country: string | null
  totalOrders: number
  rating: number
  earning: number
  walletMoney: number
  status: string
  approvalStatus: string
  vehicleType: string | null
  deviceToken: string | null
  appVersion: string | null
  createdAt: string
  documents: DriverDoc[]
}

type DriverModal = "notification" | "addMoney" | "deviceDetails" | "walletHistory" | "documents" | null

function exportCSV(drivers: Driver[]) {
  const headers = ["ID", "Nom", "Téléphone", "Email", "Zone", "Commandes", "Note", "Gains", "Wallet", "Statut", "Approbation", "Date"]
  const rows = drivers.map((d) => [d.driverId, d.name, d.phone ?? "", d.email, d.serviceArea ?? "", d.totalOrders, d.rating, d.earning, d.walletMoney, d.status, d.approvalStatus, new Date(d.createdAt).toLocaleString("fr-FR")])
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `livreurs_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [areaFilter, setAreaFilter] = useState("")
  const [perPage, setPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState<DriverModal>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [notif, setNotif] = useState({ title: "", message: "" })
  const [money, setMoney] = useState({ method: "Cash", type: "Crédit", amount: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(areaFilter && { serviceArea: areaFilter }),
      })
      const res = await fetch(`/api/drivers?${params}`)
      const data = await res.json()
      if (!data.error) {
        setDrivers(data.drivers)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, statusFilter, areaFilter])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  function openModal(type: DriverModal, driver: Driver) {
    setSelectedDriver(driver)
    setModal(type)
    setNotif({ title: "", message: "" })
    setMoney({ method: "Cash", type: "Crédit", amount: "", description: "" })
  }

  async function sendNotification() {
    if (!selectedDriver || !notif.title || !notif.message) return
    setSubmitting(true)
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notif.title, message: notif.message }),
      })
      setModal(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function addMoney() {
    if (!selectedDriver || !money.amount) return
    setSubmitting(true)
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver.id,
          amount: money.amount,
          type: money.type === "Crédit" ? "Credit" : "Debit",
          method: money.method,
          description: money.description,
        }),
      })
      setModal(null)
      fetchDrivers()
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteDriver(id: string) {
    if (!confirm("Supprimer ce livreur ?")) return
    await fetch(`/api/drivers/${id}`, { method: "DELETE" })
    fetchDrivers()
  }

  async function updateApproval(driver: Driver, status: string) {
    await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus: status }),
    })
    fetchDrivers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>🚗</span>
          <h1 className="text-lg font-semibold text-gray-700">Tous les livreurs</h1>
          {loading && <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(drivers)} className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Exporter CSV"><Download size={16} /></button>
          <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Ajouter livreur"><Plus size={16} /></button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center" title="Aide"><Info size={16} /></button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total livreurs", value: total, color: "bg-blue-500" },
          { label: "En ligne", value: drivers.filter(d => d.status === "Online").length, color: "bg-green-500" },
          { label: "En attente approbation", value: drivers.filter(d => d.approvalStatus === "Pending").length, color: "bg-orange-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>{s.value}</div>
            <span className="text-xs text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40 text-gray-500">
            <option value="">Statut livreur</option>
            <option value="Online">En ligne</option>
            <option value="Offline">Hors ligne</option>
          </select>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 text-gray-500">
            <option value="">-- Zone --</option>
            <option value="Dakar">Dakar</option>
            <option value="Rufisque">Rufisque</option>
            <option value="Pikine">Pikine</option>
          </select>
          <input placeholder="Rechercher (nom, email, tél.)" value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-52" />
          <button onClick={() => setPage(1)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Search size={16} /></button>
          <button onClick={() => { setSearch(""); setStatusFilter(""); setAreaFilter(""); setPage(1) }} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-500">Entrées par page</span>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-20">
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-xs text-gray-400 ml-2">{total} livreur(s) au total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "ID", "Zone", "Détails livreur", "Statistiques", "Transactions", "Date inscription", "Statut", "Approbation", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Aucun livreur trouvé</td></tr>
            ) : (
              drivers.map((d, i) => (
                <tr key={d.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">{d.driverId}</td>
                  <td className="px-4 py-3 text-gray-700">{d.serviceArea ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{d.name}</div>
                    <div className="text-gray-500 text-xs">{d.phone ?? "—"}</div>
                    <div className="text-gray-400 text-xs">{d.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Commandes : {d.totalOrders}
                    </span>
                    <div className="flex items-center gap-0.5 mt-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-500 text-xs">{d.rating > 0 ? d.rating.toFixed(1) : "Non noté"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div>Gains : {d.earning > 0 ? d.earning.toLocaleString("fr-FR") + " FCFA" : "Aucun"}</div>
                    <div>Portefeuille : {d.walletMoney > 0 ? d.walletMoney.toLocaleString("fr-FR") + " FCFA" : "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.approvalStatus === "Approved" ? "bg-green-100 text-green-700" : d.approvalStatus === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                      {d.approvalStatus === "Approved" ? "Approuvé" : d.approvalStatus === "Pending" ? "En attente" : "Rejeté"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap min-w-[220px]">
                      <button title="Modifier" className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={12} /></button>
                      <button title="Voir profil" className="p-1 bg-green-500 text-white rounded hover:bg-green-600"><Eye size={12} /></button>
                      <button title="Supprimer" onClick={() => deleteDriver(d.id)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12} /></button>
                      <button title="Envoyer notification" onClick={() => openModal("notification", d)} className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"><Bell size={12} /></button>
                      <button title="Ajouter de l'argent" onClick={() => openModal("addMoney", d)} className="p-1 bg-cyan-500 text-white rounded hover:bg-cyan-600"><CreditCard size={12} /></button>
                      <button title="Historique portefeuille" onClick={() => openModal("walletHistory", d)} className="p-1 bg-purple-500 text-white rounded hover:bg-purple-600"><FileText size={12} /></button>
                      <button title="Voir documents" onClick={() => openModal("documents", d)} className="p-1 bg-teal-500 text-white rounded hover:bg-teal-600"><FileText size={12} /></button>
                      <button title="Adresses" className="p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"><MapPin size={12} /></button>
                      <button title="Détails appareil" onClick={() => openModal("deviceDetails", d)} className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"><Smartphone size={12} /></button>
                      <button title={d.approvalStatus === "Approved" ? "Révoquer approbation" : "Approuver"}
                        onClick={() => updateApproval(d, d.approvalStatus === "Approved" ? "Rejected" : "Approved")}
                        className={`p-1 ${d.approvalStatus === "Approved" ? "bg-red-400 hover:bg-red-500" : "bg-green-400 hover:bg-green-500"} text-white rounded`}>
                        {d.approvalStatus === "Approved" ? <PhoneOff size={12} /> : <Phone size={12} />}
                      </button>
                      <button title="Toggle tracking" className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"><ToggleLeft size={12} /></button>
                      <button title="Déconnexion forcée" className="p-1 bg-pink-500 text-white rounded hover:bg-pink-600"><LogOut size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-3 text-xs text-gray-400 border-t flex items-center justify-between">
          <span>Affichage de {drivers.length > 0 ? (page - 1) * perPage + 1 : 0} à {Math.min(page * perPage, total)} sur {total} entrées</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">‹</button>
            <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">{page}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">›</button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {modal === "notification" && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Notification — {selectedDriver.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Titre *</label>
                <input value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Message *</label>
                <textarea value={notif.message} onChange={(e) => setNotif({ ...notif, message: e.target.value })} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={sendNotification} disabled={submitting || !notif.title || !notif.message}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {modal === "addMoney" && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Portefeuille — {selectedDriver.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-cyan-50 rounded-lg p-3 text-center">
                <p className="text-xs text-cyan-600">Solde actuel</p>
                <p className="text-2xl font-bold text-cyan-700">{selectedDriver.walletMoney.toLocaleString("fr-FR")} FCFA</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Méthode</label>
                <select value={money.method} onChange={(e) => setMoney({ ...money, method: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Cash</option><option>Orange Money</option><option>Wave</option><option>Virement</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select value={money.type} onChange={(e) => setMoney({ ...money, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Crédit</option><option>Débit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Montant (FCFA) *</label>
                <input type="number" value={money.amount} onChange={(e) => setMoney({ ...money, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea value={money.description} onChange={(e) => setMoney({ ...money, description: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={addMoney} disabled={submitting || !money.amount}
                className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50">
                {submitting ? "Traitement..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {modal === "documents" && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Documents — {selectedDriver.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-2">
              {selectedDriver.documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun document soumis</p>
              ) : (
                selectedDriver.documents.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-700">{doc.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === "Approved" ? "bg-green-100 text-green-700" : doc.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                      {doc.status === "Approved" ? "Validé" : doc.status === "Pending" ? "En attente" : "Non soumis"}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {modal === "deviceDetails" && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Appareil — {selectedDriver.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-2 text-sm">
              {[
                ["Token FCM", selectedDriver.deviceToken ?? "Non renseigné"],
                ["Version app", selectedDriver.appVersion ?? "Inconnue"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-800 font-medium text-xs truncate max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet History Modal */}
      {modal === "walletHistory" && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Portefeuille — {selectedDriver.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <DriverWalletHistory driverId={selectedDriver.id} />
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DriverWalletHistory({ driverId }: { driverId: string }) {
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; description: string | null; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/transactions?driverId=${driverId}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setTransactions(d.transactions) })
      .finally(() => setLoading(false))
  }, [driverId])

  if (loading) return <div className="p-4 text-center text-gray-400 text-sm">Chargement...</div>
  if (transactions.length === 0) return <div className="p-4 text-center text-gray-400 text-sm">Aucune transaction enregistrée</div>

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>{["Date", "Type", "Montant", "Description"].map((h) => <th key={h} className="px-3 py-2 text-left text-gray-600">{h}</th>)}</tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t">
              <td className="px-3 py-2 text-gray-500">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</td>
              <td className={`px-3 py-2 ${tx.type === "Credit" ? "text-green-600" : "text-red-600"}`}>{tx.type === "Credit" ? "Crédit" : "Débit"}</td>
              <td className="px-3 py-2">{tx.amount.toLocaleString("fr-FR")} FCFA</td>
              <td className="px-3 py-2 text-gray-500">{tx.description ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
