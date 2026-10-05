"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Avail = { id: string; _id: string; storeName: string; storeAddress: string; deliveryAddress: string; items: number; distance: string; earnings: number; total: number }
type Active = {
  id: string; _id: string; status: string; storeName: string; storeAddress: string; storePhone: string
  deliveryAddress: string; deliveryGps: { lat: number; lng: number } | null; distanceKm: number | null
  customerName: string; customerPhone: string; items: { name: string; quantity: number }[]
  total: number; paymentMethod: string; cashToCollect: number; earnings: number
}
type Hist = { orderId: string; total: number; deliveryFee: number; status: string; updatedAt: string; store?: { name: string } }
type Summary = { totalEarnings: number; totalOrders: number; walletBalance: number; todayEarnings: number; todayOrders: number }
type Driver = { id: string; name: string; email: string; phone?: string; status?: string }
type Tab = "dispo" | "cours" | "gains"

const F = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} F`
const PICKED = ["PickedUp", "Picked", "OnTheWay", "Delivering"]

export default function LivreurPage() {
  const [token, setToken] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [ready, setReady] = useState(false)
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [tab, setTab] = useState<Tab>("dispo")
  const [online, setOnline] = useState(false)
  const [avail, setAvail] = useState<Avail[]>([])
  const [active, setActive] = useState<Active[]>([])
  const [hist, setHist] = useState<Hist[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [codeFor, setCodeFor] = useState<{ order: Active; kind: "pickup" | "delivery" } | null>(null)
  const [code, setCode] = useState("")
  const lastSent = useRef(0)

  // ---- session
  useEffect(() => {
    try {
      const t = localStorage.getItem("driver_token"); const d = localStorage.getItem("driver_info")
      if (t && d) { setToken(t); const parsed = JSON.parse(d) as Driver; setDriver(parsed); setOnline(parsed.status === "Online") }
    } catch { /* stockage indisponible */ }
    setReady(true)
  }, [])

  const logout = useCallback(() => {
    setToken(null); setDriver(null); setAvail([]); setActive([]); setHist([]); setSummary(null); setOnline(false)
    try { localStorage.removeItem("driver_token"); localStorage.removeItem("driver_info") } catch { /* ignoré */ }
  }, [])

  const call = useCallback(async (path: string, init: RequestInit = {}) => {
    const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) { logout(); throw new Error("Session expirée, reconnectez-vous") }
    if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`)
    return data
  }, [token, logout])

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000) }

  async function doLogin() {
    setBusy(true); setMsg(null)
    try {
      const id = login.trim()
      const res = await fetch("/api/driver/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(id.includes("@") ? { email: id } : { phone: id }), password }),
      })
      const d = await res.json()
      if (!res.ok || !d.token) { flash(false, d.error ?? "Identifiants invalides"); return }
      setToken(d.token); setDriver(d.driver); setOnline(d.driver?.status === "Online"); setPassword("")
      try { localStorage.setItem("driver_token", d.token); localStorage.setItem("driver_info", JSON.stringify(d.driver)) } catch { /* ignoré */ }
    } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur réseau") } finally { setBusy(false) }
  }

  // ---- données
  const refreshAvail = useCallback(async () => { try { const d = await call("/api/driver/orders/available"); setAvail(Array.isArray(d) ? d : []) } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur") } }, [call])
  const refreshActive = useCallback(async () => { try { const d = await call("/api/driver/orders/active"); setActive(Array.isArray(d) ? d : []) } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur") } }, [call])
  const refreshGains = useCallback(async () => {
    try { setSummary(await call("/api/driver/earnings")); const h = await call("/api/driver/orders/history"); setHist(Array.isArray(h) ? h.slice(0, 30) : []) } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur") }
  }, [call])

  useEffect(() => { if (token) { refreshActive(); refreshAvail() } }, [token, refreshActive, refreshAvail])
  useEffect(() => { if (token && tab === "gains") refreshGains() }, [token, tab, refreshGains])
  // Actualisation automatique toutes les 20 s (uniquement en ligne et application visible)
  useEffect(() => {
    if (!token || !online) return
    const t = setInterval(() => { if (document.visibilityState === "visible") { refreshAvail(); refreshActive() } }, 20_000)
    return () => clearInterval(t)
  }, [token, online, refreshAvail, refreshActive])

  // Position du livreur : envoyée toutes les 30 s tant qu'il est en ligne et que l'application est ouverte
  useEffect(() => {
    if (!token || !online || !("geolocation" in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        if (Date.now() - lastSent.current < 30_000) return
        lastSent.current = Date.now()
        call("/api/driver/location", { method: "PUT", body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }) }).catch(() => {})
      },
      () => {}, { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [token, online, call])

  async function toggleOnline() {
    const next = !online
    try { await call("/api/driver/status", { method: "PUT", body: JSON.stringify({ online: next }) }); setOnline(next); if (next) refreshAvail() }
    catch (e) { flash(false, e instanceof Error ? e.message : "Erreur") }
  }

  async function accept(o: Avail) {
    setBusy(true)
    try {
      await call(`/api/driver/orders/${o._id}/accept`, { method: "POST" })
      flash(true, `Commande ${o.id} acceptée`)
      await Promise.all([refreshActive(), refreshAvail()]); setTab("cours")
    } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur"); refreshAvail() } finally { setBusy(false) }
  }

  async function setStatus(o: Active, status: string, otp?: string) {
    setBusy(true)
    try {
      await call(`/api/driver/orders/${o._id}/status`, { method: "PUT", body: JSON.stringify({ status, otp }) })
      flash(true, status === "Delivered" ? `Commande ${o.id} livrée, bravo !` : "Statut mis à jour")
      setCodeFor(null); setCode(""); await refreshActive(); if (status === "Delivered") refreshGains()
    } catch (e) { flash(false, e instanceof Error ? e.message : "Erreur") } finally { setBusy(false) }
  }

  // ---- navigation et appels
  const mapsTo = (o: Active, target: "store" | "customer") => {
    const url = target === "customer" && o.deliveryGps
      ? `https://www.google.com/maps/dir/?api=1&destination=${o.deliveryGps.lat},${o.deliveryGps.lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((target === "store" ? `${o.storeName} ${o.storeAddress}` : o.deliveryAddress) + ", Dakar")}`
    window.open(url, "_blank", "noopener")
  }

  // ---- affichage
  if (!ready) return <div className="grid min-h-dvh place-items-center bg-slate-50 text-sm text-slate-400">Chargement…</div>

  if (!token) {
    return (
      <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-emerald-600 to-emerald-800 p-5">
        <main className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pwa/livreur-192.png" alt="" width={64} height={64} className="mx-auto h-16 w-16 rounded-2xl shadow" />
          <h1 className="mt-3 text-center text-xl font-extrabold text-slate-900">Schoolmatik Livreur</h1>
          <p className="mb-5 text-center text-xs text-slate-400">Connectez-vous avec le compte donné par la librairie</p>
          <form onSubmit={(e) => { e.preventDefault(); doLogin() }}>
            <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" inputMode="email" placeholder="E-mail ou téléphone" className="mb-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Mot de passe" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-base" />
            <button type="submit" disabled={busy || !login || !password} className="w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white disabled:opacity-50">{busy ? "Connexion…" : "Se connecter"}</button>
          </form>
          {msg && <p className={`mt-3 rounded-lg p-2.5 text-center text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50" style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}>
      <header className="sticky top-0 z-30 bg-emerald-700 px-4 pb-3 text-white shadow" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{driver?.name}</p>
            <p className="text-[11px] opacity-80">{online ? "🟢 En ligne : vous recevez les commandes" : "⚪ Hors ligne"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleOnline} role="switch" aria-checked={online} aria-label="En ligne" className={`relative h-8 w-14 rounded-full transition ${online ? "bg-emerald-300" : "bg-emerald-900/50"}`}>
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${online ? "left-7" : "left-1"}`} />
            </button>
            <button onClick={logout} className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs">Quitter</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-3 p-4">
        {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}

        {tab === "dispo" && (
          <>
            {!online && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Passez <b>en ligne</b> (interrupteur en haut) pour recevoir les nouvelles commandes.</p>}
            <button onClick={refreshAvail} className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">🔄 Actualiser</button>
            {avail.map((o) => (
              <article key={o._id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <b className="text-sm">{o.id}</b>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-700">Gain {F(o.earnings)}</span>
                </div>
                <p className="mt-2 text-sm">📦 <b>{o.storeName}</b> · {o.storeAddress}</p>
                <p className="text-sm">📍 {o.deliveryAddress}</p>
                <p className="mt-1 text-xs text-slate-400">{o.items} article(s) · distance {o.distance} · total {F(o.total)}</p>
                <button onClick={() => accept(o)} disabled={busy} className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white disabled:opacity-50">Accepter la course</button>
              </article>
            ))}
            {avail.length === 0 && <p className="rounded-2xl bg-white py-12 text-center text-sm text-slate-400 ring-1 ring-slate-100">Aucune commande disponible pour le moment.</p>}
          </>
        )}

        {tab === "cours" && (
          <>
            {active.map((o) => {
              const picked = PICKED.includes(o.status)
              return (
                <article key={o._id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200">
                  <div className="flex items-center justify-between">
                    <b className="text-sm">{o.id}</b>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-700">Gain {F(o.earnings)}</span>
                  </div>
                  <ol className="mt-3 space-y-3 text-sm">
                    <li className={picked ? "opacity-50" : ""}>
                      <p className="font-semibold text-amber-700">1 · Ramassage {picked && "✓"}</p>
                      <p>{o.storeName} — {o.storeAddress}</p>
                    </li>
                    <li>
                      <p className="font-semibold text-indigo-700">2 · Livraison{o.distanceKm != null ? ` (${String(o.distanceKm).replace(".", ",")} km)` : ""}</p>
                      <p>{o.deliveryAddress || "Adresse communiquée par le client"}</p>
                      <p className="text-slate-500">👤 {o.customerName}{o.customerPhone ? ` · ${o.customerPhone}` : ""}</p>
                    </li>
                  </ol>
                  <p className="mt-2 text-xs text-slate-400">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
                  {o.cashToCollect > 0 && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-800">💵 Espèces à encaisser : {F(o.cashToCollect)}</p>}
                  {o.paymentMethod !== "Cash" && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">Déjà payée en ligne : ne rien encaisser.</p>}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => mapsTo(o, picked ? "customer" : "store")} className="rounded-xl bg-slate-100 py-2.5 text-sm font-semibold">🧭 Itinéraire {picked ? "client" : "boutique"}</button>
                    {picked
                      ? <a href={o.customerPhone ? `tel:${o.customerPhone}` : undefined} className={`rounded-xl py-2.5 text-center text-sm font-semibold ${o.customerPhone ? "bg-slate-100" : "bg-slate-50 text-slate-300"}`}>📞 Appeler client</a>
                      : <a href={o.storePhone ? `tel:${o.storePhone}` : undefined} className={`rounded-xl py-2.5 text-center text-sm font-semibold ${o.storePhone ? "bg-slate-100" : "bg-slate-50 text-slate-300"}`}>📞 Appeler boutique</a>}
                  </div>

                  {o.status === "Accepted" && (
                    <button onClick={() => { setCodeFor({ order: o, kind: "pickup" }); setCode("") }} className="mt-3 w-full rounded-xl bg-amber-500 py-3 text-base font-bold text-white">J&apos;ai récupéré la commande</button>
                  )}
                  {picked && o.status !== "OnTheWay" && o.status !== "Delivering" && (
                    <button onClick={() => setStatus(o, "OnTheWay")} disabled={busy} className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-base font-bold text-white disabled:opacity-50">Je suis en route</button>
                  )}
                  {picked && (
                    <button onClick={() => { setCodeFor({ order: o, kind: "delivery" }); setCode("") }} className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white">Livré au client</button>
                  )}
                </article>
              )
            })}
            {active.length === 0 && (
              <div className="rounded-2xl bg-white py-12 text-center ring-1 ring-slate-100">
                <p className="text-4xl">🛵</p>
                <p className="mt-2 text-sm text-slate-400">Aucune livraison en cours.</p>
                <button onClick={() => setTab("dispo")} className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">Voir les commandes disponibles</button>
              </div>
            )}
          </>
        )}

        {tab === "gains" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-slate-100"><p className="text-xs text-slate-400">Aujourd&apos;hui</p><p className="text-xl font-extrabold text-emerald-700">{F(summary?.todayEarnings ?? 0)}</p><p className="text-xs text-slate-400">{summary?.todayOrders ?? 0} livraison(s)</p></div>
              <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-slate-100"><p className="text-xs text-slate-400">Solde disponible</p><p className="text-xl font-extrabold text-slate-800">{F(summary?.walletBalance ?? 0)}</p><p className="text-xs text-slate-400">{summary?.totalOrders ?? 0} livraison(s) au total</p></div>
            </div>
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Dernières livraisons</p>
            {hist.map((h) => (
              <div key={h.orderId} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm ring-1 ring-slate-100">
                <div className="min-w-0"><p className="truncate font-semibold">{h.orderId}</p><p className="text-xs text-slate-400">{h.store?.name ?? "Boutique"} · {new Date(h.updatedAt).toLocaleDateString("fr-FR")}</p></div>
                <b className={h.status === "Delivered" ? "text-emerald-700" : "text-slate-400"}>{h.status === "Delivered" ? `+${F(h.deliveryFee)}` : "Annulée"}</b>
              </div>
            ))}
            {hist.length === 0 && <p className="rounded-2xl bg-white py-10 text-center text-sm text-slate-400 ring-1 ring-slate-100">Pas encore de livraison.</p>}
          </>
        )}
      </main>

      {codeFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setCodeFor(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (code.trim().length >= 4) setStatus(codeFor.order, codeFor.kind === "pickup" ? "PickedUp" : "Delivered", code.trim()) }}
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <h2 className="text-base font-bold text-slate-900">{codeFor.kind === "pickup" ? "Code de ramassage" : "Code de livraison"}</h2>
            <p className="mt-1 text-sm text-slate-500">{codeFor.kind === "pickup" ? "Demandez ce code à la boutique avant de partir." : "Demandez ce code au client à la remise du colis."}</p>
            <input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-center font-mono text-2xl tracking-[0.4em]" />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCodeFor(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold">Annuler</button>
              <button type="submit" disabled={busy || code.trim().length < 4} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-50">{busy ? "…" : "Valider"}</button>
            </div>
          </form>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-md grid-cols-3">
          {([["dispo", "📦", "Disponibles", avail.length], ["cours", "🛵", "En cours", active.length], ["gains", "💰", "Gains", 0]] as const).map(([key, icon, label, n]) => (
            <button key={key} onClick={() => setTab(key)} className={`relative py-2.5 text-center text-xs font-semibold ${tab === key ? "text-emerald-700" : "text-slate-400"}`}>
              <span className="block text-xl">{icon}</span>{label}
              {n > 0 && <span className="absolute right-6 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{n}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
