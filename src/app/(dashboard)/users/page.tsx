"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Download, Info, Edit, Trash2, Bell, CreditCard, FileText, Eye, MapPin, Smartphone, LogOut, Settings, RefreshCw, Search } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

interface User {
  id: string
  userId: number
  name: string
  phone: string | null
  email: string
  walletMoney: number
  userType: string
  signupType: string
  signupFrom: string
  country: string | null
  status: string
  createdAt: string
}

type ModalType = "notification" | "addMoney" | "deviceDetails" | "walletHistory" | null

function exportCSV(users: User[]) {
  const headers = ["ID", "Nom", "Téléphone", "Email", "Solde", "Type", "Pays", "Statut", "Date"]
  const rows = users.map((u) => [u.userId, u.name, u.phone ?? "", u.email, u.walletMoney, u.userType, u.country ?? "", u.status, new Date(u.createdAt).toLocaleString("fr-FR")])
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tableSearch, setTableSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [country, setCountry] = useState("")
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [notif, setNotif] = useState({ title: "", message: "", image: "" })
  const [money, setMoney] = useState({ method: "Cash", type: "Crédit", amount: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(tableSearch && { search: tableSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(country && { country }),
      })
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      if (!data.error) {
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, perPage, tableSearch, statusFilter, country])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openModal(type: ModalType, user: User) {
    setSelectedUser(user)
    setModal(type)
    setNotif({ title: "", message: "", image: "" })
    setMoney({ method: "Cash", type: "Crédit", amount: "", description: "" })
  }

  async function sendNotification() {
    if (!selectedUser || !notif.title || !notif.message) return
    setSubmitting(true)
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notif.title, message: notif.message, imageUrl: notif.image }),
      })
      setModal(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function addMoney() {
    if (!selectedUser || !money.amount) return
    setSubmitting(true)
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: money.amount,
          type: money.type === "Crédit" ? "Credit" : "Debit",
          method: money.method,
          description: money.description,
        }),
      })
      setModal(null)
      fetchUsers()
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return
    await fetch(`/api/users/${id}`, { method: "DELETE" })
    fetchUsers()
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === "Active" ? "Inactive" : "Active"
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchUsers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>👥</span>
          <h1 className="text-lg font-semibold text-gray-700">Gestion des utilisateurs</h1>
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Ajouter"><Plus size={16} /></button>
          <button onClick={() => exportCSV(users)} className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center" title="Exporter CSV"><Download size={16} /></button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center" title="Aide"><Info size={16} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            placeholder="Rechercher (nom, email, tél.)"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-56"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none w-36 text-gray-500">
            <option value="">-- Statut --</option>
            <option value="Active">Actif</option>
            <option value="Inactive">Inactif</option>
            <option value="Blocked">Bloqué</option>
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none w-36 text-gray-500">
            <option value="">-- Pays --</option>
            <option value="Sénégal">Sénégal</option>
            <option value="France">France</option>
          </select>
          <button onClick={() => setPage(1)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Search size={16} /></button>
          <button onClick={() => { setTableSearch(""); setStatusFilter(""); setCountry(""); setPage(1) }} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="p-3 border-b border-gray-50 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            Entrées :
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-200 rounded px-2 py-1 text-xs w-16 focus:outline-none">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <span>{total} utilisateurs au total</span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "ID", "Détails", "Solde (FCFA)", "Type", "Pays", "Date", "Statut", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Aucun utilisateur trouvé</td></tr>
            ) : (
              users.map((user, i) => (
                <tr key={user.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{user.userId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{user.name}</div>
                    <div className="text-gray-500 text-xs">{user.phone ?? "—"}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-cyan-600 font-medium">{user.walletMoney.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{user.userType}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{user.country ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap min-w-[180px]">
                      <button title="Voir profil" className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"><Eye size={12} /></button>
                      <button title="Modifier" className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={12} /></button>
                      <button title="Supprimer" onClick={() => deleteUser(user.id)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12} /></button>
                      <button title="Envoyer notification" onClick={() => openModal("notification", user)} className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"><Bell size={12} /></button>
                      <button title="Ajouter de l'argent" onClick={() => openModal("addMoney", user)} className="p-1 bg-cyan-500 text-white rounded hover:bg-cyan-600"><CreditCard size={12} /></button>
                      <button title="Historique portefeuille" onClick={() => openModal("walletHistory", user)} className="p-1 bg-purple-500 text-white rounded hover:bg-purple-600"><FileText size={12} /></button>
                      <button title="Adresses" className="p-1 bg-teal-500 text-white rounded hover:bg-teal-600"><MapPin size={12} /></button>
                      <button title="Appareil" onClick={() => openModal("deviceDetails", user)} className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"><Smartphone size={12} /></button>
                      <button title={user.status === "Active" ? "Désactiver" : "Activer"} onClick={() => toggleStatus(user)} className={`p-1 ${user.status === "Active" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white rounded`}><Settings size={12} /></button>
                      <button title="Déconnexion forcée" className="p-1 bg-pink-500 text-white rounded hover:bg-pink-600"><LogOut size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-3 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Affichage de {users.length > 0 ? (page - 1) * perPage + 1 : 0} à {Math.min(page * perPage, total)} sur {total} entrées</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + idx
              return <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded border ${page === p ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 hover:bg-gray-50"}`}>{p}</button>
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        </div>
      </div>

      {/* Modal: Notification */}
      {modal === "notification" && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Notification — {selectedUser.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Titre *</label>
                <input value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Message *</label>
                <textarea value={notif.message} onChange={(e) => setNotif({ ...notif, message: e.target.value })} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image (URL)</label>
                <input value={notif.image} onChange={(e) => setNotif({ ...notif, image: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
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

      {/* Modal: Add Money */}
      {modal === "addMoney" && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Portefeuille — {selectedUser.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-cyan-50 rounded-lg p-3 text-center">
                <p className="text-xs text-cyan-600">Solde actuel</p>
                <p className="text-2xl font-bold text-cyan-700">{selectedUser.walletMoney.toLocaleString("fr-FR")} FCFA</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Méthode</label>
                <select value={money.method} onChange={(e) => setMoney({ ...money, method: e.target.value })
                } className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Cash</option><option>Orange Money</option><option>Wave</option><option>Virement</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select value={money.type} onChange={(e) => setMoney({ ...money, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Crédit</option><option>Débit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Montant (FCFA) *</label>
                <input type="number" value={money.amount} onChange={(e) => setMoney({ ...money, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={money.description} onChange={(e) => setMoney({ ...money, description: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
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

      {/* Modal: Device Details */}
      {modal === "deviceDetails" && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Appareil — {selectedUser.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 text-sm text-center text-gray-400 py-8">
              Informations d&apos;appareil non disponibles
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Wallet History */}
      {modal === "walletHistory" && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Historique portefeuille — {selectedUser.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <WalletHistory userId={selectedUser.id} />
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WalletHistory({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; description: string | null; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/transactions?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setTransactions(d.transactions) })
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4 text-center text-gray-400 text-sm">Chargement...</div>
  if (transactions.length === 0) return <div className="p-4 text-center text-gray-400 text-sm">Aucune transaction</div>

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
