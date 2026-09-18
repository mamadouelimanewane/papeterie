"use client"

import { useEffect, useState } from "react"

type AvailOrder = {
  id: string; _id: string; storeName: string; storeAddress: string
  deliveryAddress: string; customerName: string; customerPhone: string
  total: number; earnings: number; distance: string
}

const STEPS = ["Accepted", "PickedUp", "OnTheWay", "Delivered"]

export default function LivreurPage() {
  const [token, setToken] = useState<string | null>(null)
  const [login, setLogin] = useState("livreur@papeterie.sn")
  const [password, setPassword] = useState("")
  const [driver, setDriver] = useState<any>(null)
  const [orders, setOrders] = useState<AvailOrder[]>([])
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      const t = localStorage.getItem("driver_token")
      const d = localStorage.getItem("driver_info")
      if (t) setToken(t)
      if (d) setDriver(JSON.parse(d))
    } catch {}
  }, [])

  async function doLogin() {
    setBusy(true); setMsg("")
    try {
      const res = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login, password }),
      })
      const d = await res.json()
      if (d.token) {
        setToken(d.token); setDriver(d.driver)
        try { localStorage.setItem("driver_token", d.token); localStorage.setItem("driver_info", JSON.stringify(d.driver)) } catch {}
      } else setMsg(d.error ?? "Identifiants invalides")
    } catch (e: any) { setMsg(e?.message ?? "Erreur") } finally { setBusy(false) }
  }

  function logout() {
    setToken(null); setDriver(null); setOrders([])
    try { localStorage.removeItem("driver_token"); localStorage.removeItem("driver_info") } catch {}
  }

  async function loadAvailable() {
    setBusy(true); setMsg("")
    try {
      const res = await fetch("/api/driver/orders/available", { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      setOrders(Array.isArray(d) ? d : [])
      if (!Array.isArray(d)) setMsg(d.error ?? "Erreur")
    } catch (e: any) { setMsg(e?.message ?? "Erreur") } finally { setBusy(false) }
  }

  async function accept(o: AvailOrder) {
    setBusy(true); setMsg("")
    try {
      const res = await fetch(`/api/driver/orders/${o._id}/accept`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      setMsg(d.error ? `Erreur : ${d.error}` : `Commande ${o.id} acceptée (statut ${d.status})`)
      loadAvailable()
    } catch (e: any) { setMsg(e?.message ?? "Erreur") } finally { setBusy(false) }
  }

  async function setStatus(o: AvailOrder, status: string) {
    setBusy(true); setMsg("")
    try {
      const res = await fetch(`/api/driver/orders/${o._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      setMsg(d.error ? `Erreur : ${d.error}` : `Commande ${o.id} → ${status}`)
    } catch (e: any) { setMsg(e?.message ?? "Erreur") } finally { setBusy(false) }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-sm p-6">
        <h1 className="mb-1 text-xl font-bold">Espace livreur (test)</h1>
        <p className="mb-4 text-sm text-gray-500">Connexion livreur — parcours web sans app mobile.</p>
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Email / téléphone" className="mb-2 w-full rounded border px-3 py-2" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="mb-2 w-full rounded border px-3 py-2" />
        <button onClick={doLogin} disabled={busy} className="w-full rounded bg-indigo-600 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? "…" : "Se connecter"}
        </button>
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
        <p className="mt-3 text-xs text-gray-400">Démo : livreur@papeterie.sn / Demo2024!</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center justify-between rounded-xl bg-indigo-600 p-4 text-white">
        <div>
          <h1 className="font-bold">Livreur : {driver?.name}</h1>
          <p className="text-xs opacity-80">{driver?.email}</p>
        </div>
        <button onClick={logout} className="rounded bg-white/20 px-3 py-1 text-sm">Déconnexion</button>
      </header>

      <button onClick={loadAvailable} disabled={busy} className="mb-3 w-full rounded bg-emerald-600 py-2 font-semibold text-white disabled:opacity-50">
        {busy ? "…" : "Rafraîchir les commandes disponibles"}
      </button>
      {msg && <p className="mb-3 rounded bg-gray-100 p-2 text-sm">{msg}</p>}

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="rounded-lg border p-3">
            <div className="flex justify-between text-sm">
              <b>{o.id}</b><span className="text-emerald-600">Gain {o.earnings} F</span>
            </div>
            <p className="text-sm">📦 {o.storeName} — {o.storeAddress}</p>
            <p className="text-sm">📍 {o.deliveryAddress} · {o.customerName} ({o.customerPhone})</p>
            <p className="text-xs text-gray-500">Total {o.total} F · {o.distance}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => accept(o)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Accepter</button>
              {STEPS.map((s) => (
                <button key={s} onClick={() => setStatus(o, s)} className="rounded bg-gray-200 px-3 py-1 text-sm">{s}</button>
              ))}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-sm text-gray-500">Aucune commande. Clique sur « Rafraîchir ».</p>}
      </div>
    </main>
  )
}
