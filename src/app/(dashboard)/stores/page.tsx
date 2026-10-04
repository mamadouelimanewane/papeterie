"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Info, Search, RefreshCw, Edit, Eye, BarChart2, Copy, Check, X, KeyRound, Loader2, ShieldOff } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import Link from "next/link"
import FormModal from "@/components/admin/FormModal"
import { useFeedback, useAction } from "@/components/admin/Feedback"
import { useOptions } from "@/hooks/useAdminData"
import { adminFetch } from "@/lib/adminApi"

interface Store {
  id: string
  name: string
  phone: string | null
  email: string
  address: string | null
  image: string | null
  rating: number
  walletMoney: number
  status: string
  serviceArea: string | null
  segment: string
  totalOrders: number
  createdAt: string
  _count: { orders: number; products: number }
}

interface AccessState {
  hasPassword: boolean
  invitePending: boolean
  inviteExpiresAt: string | null
  lastLoginAt: string | null
}

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ name: "", email: "", phone: "" })
  const [urlModal, setUrlModal] = useState<{ open: boolean; store: Store | null }>({ open: false, store: null })
  const [access, setAccess] = useState<AccessState | null>(null)
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState<Store | "new" | null>(null)
  const zones = useOptions("crud/service-areas")
  const { toast, confirm } = useFeedback()
  const run = useAction()

  const fetchStores = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.name) params.set("search", search.name)
      const res = await fetch(`/api/stores?${params}`)
      const data = await res.json()
      if (!Array.isArray(data.error)) setStores(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [search.name])

  useEffect(() => { fetchStores() }, [fetchStores])

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.name.toLowerCase()) &&
      s.email.toLowerCase().includes(search.email.toLowerCase()) &&
      (s.phone ?? "").includes(search.phone)
  )

  const loadAccess = async (store: Store) => {
    setAccess(null)
    try { setAccess(await adminFetch<AccessState>(`/api/admin/stores/${store.id}/access`)) }
    catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
  }

  const openUrlModal = (store: Store) => {
    setUrlModal({ open: true, store }); setInvite(null); setCopied(false); loadAccess(store)
  }
  const closeUrlModal = () => { setUrlModal({ open: false, store: null }); setInvite(null) }

  // Le lien est généré côté serveur (jeton aléatoire, usage unique, 72 h) et n'est affiché qu'une fois.
  const generateInvite = async () => {
    const store = urlModal.store
    if (!store) return
    if (access?.hasPassword && !(await confirm({
      title: "Générer un nouveau lien ?",
      message: "Le marchand a déjà un mot de passe. Le lien lui permettra d'en définir un nouveau (l'ancien reste valable d'ici là).",
      confirmLabel: "Générer",
    }))) return
    setBusy(true)
    try {
      setInvite(await adminFetch<{ url: string; expiresAt: string }>(`/api/admin/stores/${store.id}/access`, { method: "POST" }))
      setCopied(false)
      loadAccess(store)
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "error") }
    finally { setBusy(false) }
  }

  const revokeAccess = async () => {
    const store = urlModal.store
    if (!store || !(await confirm({
      title: "Révoquer l'accès marchand ?",
      message: `${store.name} sera déconnecté immédiatement ; mot de passe et lien en cours seront effacés.`,
      confirmLabel: "Révoquer", danger: true,
    }))) return
    const ok = await run(() => adminFetch(`/api/admin/stores/${store.id}/access`, { method: "DELETE" }), "Accès révoqué")
    if (ok) { setInvite(null); loadAccess(store) }
  }

  const copyUrl = async () => {
    if (!invite) return
    await navigator.clipboard.writeText(invite.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">🏫</span>
          <h1 className="text-lg font-semibold text-gray-700">Boutiques Papeterie</h1>
          {loading && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing("new")} title="Ajouter une boutique" className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center">
            <Plus size={16} />
          </button>
          <button onClick={() => toast("Mode mono-boutique : la vitrine /shop affiche la boutique active (variable ACTIVE_STORE_ID, sinon la première boutique active). Le bouton « Accès marchand » génère un lien d'invitation (usage unique, 72 h) pour que le responsable définisse son mot de passe de l'espace marchand.", "info")} title="Aide" className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <span className="text-2xl">🎒</span>
        <div>
          <p className="text-sm font-semibold text-indigo-800">Papeterie — Plateforme multi-boutiques</p>
          <p className="text-xs text-indigo-600">{stores.length} boutique(s) active(s) — Papeterie & fournitures scolaires au Sénégal.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row flex-wrap gap-3 items-end">
          {(["name", "email", "phone"] as const).map((field) => (
            <div key={field} className="w-full md:w-48">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block capitalize">{field === "name" ? "Nom" : field === "email" ? "Email" : "Téléphone"}</label>
              <input
                placeholder={field === "name" ? "Ex: Schoolmatik Librairie" : field === "email" ? "contact@..." : "77..."}
                value={search[field]}
                onChange={(e) => setSearch({ ...search, [field]: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={fetchStores} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Search size={16} /></button>
            <button onClick={() => { setSearch({ name: "", email: "", phone: "" }); fetchStores() }} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Coordonnées", "Adresse", "Commandes", "Produits", "Accès marchand", "Note", "Solde (FCFA)", "Statut", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Aucune boutique trouvée</td></tr>
            ) : (
              filtered.map((store, i) => (
                <tr key={store.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">🏫 {store.name}</div>
                    <div className="text-gray-500 text-xs">Tél. : {store.phone ?? "—"}</div>
                    <div className="text-gray-400 text-xs">{store.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{store.address ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-medium text-orange-600">{store._count.orders}</td>
                  <td className="px-4 py-3 text-xs font-medium text-teal-600">{store._count.products}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openUrlModal(store)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600">
                      <KeyRound size={12} /> Accès marchand
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-700">{store.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{store.walletMoney.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge status={store.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(store)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Modifier"><Edit size={14} /></button>
                      <Link href={`/stores/${store.id}`} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Voir"><Eye size={14} /></Link>
                      <Link href="/reports/earnings/stores" className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600" title="Statistiques"><BarChart2 size={14} /></Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t">
          {filtered.length} boutique(s) affichée(s)
        </div>
      </div>

      {/* Accès marchand */}
      {urlModal.open && urlModal.store && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Accès à l&apos;espace marchand</h2>
                <p className="text-xs text-gray-500 mt-0.5">{urlModal.store.name} · {urlModal.store.email}</p>
              </div>
              <button onClick={closeUrlModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-400">Mot de passe</div>
                  <div className="font-medium text-gray-700 mt-0.5">{access ? (access.hasPassword ? "Défini" : "Non défini") : "…"}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-400">Invitation en cours</div>
                  <div className="font-medium text-gray-700 mt-0.5">{access ? (access.invitePending ? `jusqu'au ${fmtDateTime(access.inviteExpiresAt)}` : "Aucune") : "…"}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-400">Dernière connexion</div>
                  <div className="font-medium text-gray-700 mt-0.5">{access ? fmtDateTime(access.lastLoginAt) : "…"}</div>
                </div>
              </div>

              {invite ? (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Lien d&apos;invitation (valable jusqu&apos;au {fmtDateTime(invite.expiresAt)})</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span data-no-i18n className="text-xs text-gray-600 break-all font-mono">{invite.url}</span>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3">
                    Ce lien ne sera plus affiché : copiez-le maintenant et transmettez-le au seul responsable de la boutique
                    (il ne fonctionne qu&apos;une fois). Il lui permet de choisir son mot de passe ; il se connectera ensuite
                    sur /merchant/login avec l&apos;e-mail de la boutique.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-700">
                    Générez un lien d&apos;invitation sécurisé (usage unique, 72 h) pour que le responsable définisse — ou
                    réinitialise — son mot de passe. Un nouveau lien annule le précédent.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3">
              {invite ? (
                <button onClick={copyUrl}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium ${copied ? "bg-green-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copié !" : "Copier le lien"}
                </button>
              ) : (
                <button onClick={generateInvite} disabled={busy || !access}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Générer un lien d&apos;invitation
                </button>
              )}
              {access && (access.hasPassword || access.invitePending) && (
                <button onClick={revokeAccess}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium">
                  <ShieldOff size={16} /> Révoquer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <FormModal
        open={editing !== null} title={editing === "new" ? "Ajouter une boutique" : `Modifier ${editing?.name ?? ""}`}
        initial={editing && editing !== "new"
          ? { name: editing.name, email: editing.email, phone: editing.phone ?? "", address: editing.address ?? "", serviceArea: editing.serviceArea ?? "", image: editing.image ?? "", status: editing.status }
          : { status: "Active" }}
        fields={[
          { key: "name", label: "Nom", required: true },
          { key: "email", label: "E-mail", type: "email", required: true },
          { key: "phone", label: "Téléphone", type: "tel" },
          { key: "serviceArea", label: "Zone", type: "select", options: zones },
          { key: "address", label: "Adresse", full: true },
          { key: "status", label: "Statut", type: "select", required: true, options: [{ value: "Active", label: "Actif" }, { value: "Inactive", label: "Inactif" }] },
          { key: "image", label: "Logo / photo", type: "image" },
        ]}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const ok = editing === "new"
            ? await run(() => adminFetch("/api/stores", { method: "POST", body: v }), "Boutique ajoutée")
            : await run(() => adminFetch(`/api/stores/${(editing as Store).id}`, { method: "PATCH", body: v }), "Boutique modifiée")
          if (ok) { setEditing(null); fetchStores() }
        }}
      />
    </div>
  )
}
