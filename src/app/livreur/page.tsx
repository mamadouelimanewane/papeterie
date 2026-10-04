"use client"

import { useEffect, useState } from "react"

type AvailOrder = {
  id: string; _id: string; storeName: string; storeAddress: string
  deliveryAddress: string; customerName: string; customerPhone: string
  total: number; earnings: number; distance: string
}

const STEPS = ["Accepted", "PickedUp", "OnTheWay", "Delivered"]
const STEP_LABEL: Record<string, string> = { Accepted: "Accepté", PickedUp: "Récupéré", OnTheWay: "En route", Delivered: "Livré" }

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
    // Codes de sécurité : ramassage (donné par la boutique) et livraison (donné par le client)
    let otp: string | null = null
    if (status === "PickedUp" || status === "Delivered") {
      otp = window.prompt(status === "PickedUp" ? "Code de ramassage (donné par la boutique) :" : "Code de livraison (donné par le client) :")
      if (!otp) return
    }
    setBusy(true); setMsg("")
    try {
      const res = await fetch(`/api/driver/orders/${o._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, otp: otp?.trim() }),
      })
      const d = await res.json()
      setMsg(d.error ? `Erreur : ${d.error}` : `Commande ${o.id} → ${status}`)
    } catch (e: any) { setMsg(e?.message ?? "Erreur") } finally { setBusy(false) }
  }

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <main className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl">🛵</span>
            <div>
              <h1 className="text-lg font-extrabold text-indigo-700">Espace livreur</h1>
              <p className="text-xs text-slate-400">Schoolmatik Librairie</p>
            </div>
          </div>
          <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Email / téléphone" className="mb-2 w-full rounded-lg border px-3 py-2.5 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="mb-3 w-full rounded-lg border px-3 py-2.5 text-sm" />
          <button onClick={doLogin} disabled={busy} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
            {busy ? "…" : "Se connecter"}
          </button>
          {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
          <p className="mt-3 rounded-lg bg-slate-50 p-2 text-center text-xs text-slate-400">Démo : livreur@papeterie.sn / Demo2024!</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl p-4">
        <header className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-2xl">🛵</span>
            <div>
              <h1 className="font-bold">{driver?.name}</h1>
              <p className="text-xs opacity-80">{driver?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg bg-white/20 px-3 py-1.5 text-sm transition hover:bg-white/30">Déconnexion</button>
        </header>

        <button onClick={loadAvailable} disabled={busy} className="mb-3 w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "…" : "🔄 Rafraîchir les commandes disponibles"}
        </button>
        {msg && <p className="mb-3 rounded-lg bg-indigo-50 p-2.5 text-sm text-indigo-700">{msg}</p>}

        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 transition hover:shadow-md">
              <div className="mb-1 flex items-center justify-between">
                <b className="text-sm">{o.id}</b>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-600">Gain {o.earnings} F</span>
              </div>
              <p className="text-sm">📦 {o.storeName} — {o.storeAddress}</p>
              <p className="text-sm">📍 {o.deliveryAddress} · {o.customerName} ({o.customerPhone})</p>
              <p className="text-xs text-slate-400">Total {o.total} F · {o.distance}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => accept(o)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700">Accepter</button>
                {STEPS.map((s) => (
                  <button key={s} onClick={() => setStatus(o, s)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">{STEP_LABEL[s] ?? s}</button>
                ))}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="rounded-2xl bg-white py-10 text-center text-sm text-slate-400 ring-1 ring-slate-100">Aucune commande pour le moment. Clique sur « Rafraîchir ».</p>}
        </div>
      </main>
    </div>
  )
}
