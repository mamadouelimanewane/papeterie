"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Search, RefreshCw, Navigation, Phone, Package, Route, MapPin, Loader2 } from "lucide-react"
import type { MapMarker, MapRoute } from "@/components/ui/LeafletMap"
import { getDirections, reverseGeocode, LOCATIONIQ_KEY } from "@/lib/locationiq"
import { adminFetch } from "@/lib/adminApi"

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const LeafletMap = dynamic(() => import("@/components/ui/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-gray-100">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  ),
})

type DriverState = "online" | "delivering" | "offline"
type LiveDriver = {
  id: string; name: string; phone: string | null; vehicle: string | null; zone: string | null
  position: { lat: number; lng: number } | null
  lastSeen: string; state: DriverState
  orders: { orderId: string; address: string | null; status: string }[]
}

const STATUS = {
  online: { label: "En ligne", color: "green" as const, badge: "bg-green-100 text-green-700" },
  delivering: { label: "En livraison", color: "orange" as const, badge: "bg-orange-100 text-orange-700" },
  offline: { label: "Hors ligne", color: "gray" as const, badge: "bg-gray-100 text-gray-500" },
}
const REFRESH_MS = 15_000
const BOUTIQUE = { lat: 14.6928, lng: -17.4467 } // point de départ des itinéraires

/** « il y a 3 min » à partir de la dernière mise à jour reçue du livreur. */
function since(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`
  return `il y a ${Math.round(s / 86400)} j`
}

export default function DriverMapPage() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<DriverState | "all">("all")
  const [selected, setSelected] = useState<string | null>(null)
  const [routes, setRoutes] = useState<MapRoute[]>([])
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets")

  const load = useCallback(async () => {
    try {
      setDrivers(await adminFetch<LiveDriver[]>("/api/admin/drivers/live"))
      setError(null); setUpdatedAt(new Date())
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de chargement") } finally { setLoading(false) }
  }, [])

  // Positions rafraîchies toutes les 15 s (l'application livreur les transmet pendant les livraisons)
  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.name.toLowerCase().includes(q) || (d.zone ?? "").toLowerCase().includes(q)
    return matchSearch && (filter === "all" || d.state === filter)
  })
  const located = filtered.filter((d) => d.position)

  const markers: MapMarker[] = useMemo(() => located.map((d) => ({
    id: d.id,
    lat: d.position!.lat,
    lng: d.position!.lng,
    color: STATUS[d.state].color,
    title: d.name,
    popup: `<strong>${d.name.replace(/</g, "&lt;")}</strong><br/>${STATUS[d.state].label} · ${since(d.lastSeen)}${d.orders[0] ? `<br/>Commande ${d.orders[0].orderId}` : ""}`,
  })), [located])

  const selectedDriver = drivers.find((d) => d.id === selected)

  // Adresse approximative du livreur sélectionné (nécessite une clé LocationIQ)
  const selLat = selectedDriver?.position?.lat, selLng = selectedDriver?.position?.lng
  useEffect(() => {
    if (!LOCATIONIQ_KEY || selLat === undefined || selLng === undefined) return
    let alive = true
    reverseGeocode(selLat, selLng)
      .then((r) => alive && setAddress(r.display_name?.split(",").slice(0, 3).join(", ") ?? null))
      .catch(() => alive && setAddress(null))
    return () => { alive = false; setAddress(null) }
  }, [selLat, selLng])

  const showRoute = useCallback(async () => {
    if (!selectedDriver?.position) return
    setLoadingRoute(true); setRoutes([]); setRouteInfo(null)
    try {
      const result = await getDirections(BOUTIQUE, selectedDriver.position)
      const route = result.routes[0]
      if (route) {
        setRoutes([{ coordinates: route.geometry.coordinates, color: "#3b82f6" }])
        setRouteInfo({ distance: `${(route.distance / 1000).toFixed(1)} km`, duration: `${Math.round(route.duration / 60)} min` })
      }
    } catch { setRouteInfo(null) } finally { setLoadingRoute(false) }
  }, [selectedDriver])

  const stats = {
    online: drivers.filter((d) => d.state === "online").length,
    delivering: drivers.filter((d) => d.state === "delivering").length,
    offline: drivers.filter((d) => d.state === "offline").length,
  }
  const withoutPosition = filtered.length - located.length

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
            <MapPin size={18} className="text-blue-500" /> Carte des livreurs — temps réel
          </h1>
          <p className="text-xs text-gray-400">
            {updatedAt ? `Mis à jour ${since(updatedAt.toISOString())} · actualisation toutes les 15 s` : "Chargement…"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setMapStyle("streets")}
            className={`rounded-lg border px-3 py-1.5 font-medium transition-colors ${mapStyle === "streets" ? "border-blue-500 bg-blue-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"}`}>
            Plan
          </button>
          <button onClick={() => setMapStyle("satellite")}
            className={`rounded-lg border px-3 py-1.5 font-medium transition-colors ${mapStyle === "satellite" ? "border-blue-500 bg-blue-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"}`}>
            Satellite
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: "online", label: "En ligne", val: stats.online, color: "text-green-600 bg-green-50 border-green-100" },
          { key: "delivering", label: "En livraison", val: stats.delivering, color: "text-orange-600 bg-orange-50 border-orange-100" },
          { key: "offline", label: "Hors ligne", val: stats.offline, color: "text-gray-500 bg-gray-50 border-gray-100" },
        ] as const).map((s) => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`rounded-xl border px-4 py-3 text-left ${s.color} ${filter === s.key ? "ring-2 ring-blue-300" : ""}`}>
            <p className="text-2xl font-bold tabular-nums">{s.val}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Carte */}
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm lg:col-span-2">
          <LeafletMap
            center={[BOUTIQUE.lat, BOUTIQUE.lng]}
            zoom={12}
            markers={markers}
            routes={routes}
            style={mapStyle}
            fitToMarkers
            className="h-[500px]"
            onMarkerClick={(id) => { setSelected(String(id)); setRoutes([]); setRouteInfo(null) }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {Object.entries(STATUS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-full ${v.color === "green" ? "bg-green-500" : v.color === "orange" ? "bg-orange-400" : "bg-gray-400"}`} />
                {v.label}
              </span>
            ))}
            {withoutPosition > 0 && <span className="ml-auto">{withoutPosition} livreur(s) sans position connue</span>}
          </div>
          {!loading && !located.length && (
            <p className="mt-2 text-xs text-gray-400">Aucune position reçue pour l&apos;instant : la position est transmise par l&apos;application livreur pendant une livraison.</p>
          )}
        </div>

        {/* Panneau livreurs */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <button onClick={() => { setSearch(""); setFilter("all"); setRoutes([]); setSelected(null); load() }} title="Actualiser"
              className="rounded-lg bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="max-h-80 flex-1 space-y-1.5 overflow-y-auto">
            {loading && !drivers.length && <div className="h-10 animate-pulse rounded-lg bg-gray-100" />}
            {!loading && !filtered.length && <p className="py-6 text-center text-xs text-gray-400">Aucun livreur</p>}
            {filtered.map((d) => (
              <button key={d.id} onClick={() => { setSelected(d.id === selected ? null : d.id); setRoutes([]); setRouteInfo(null) }}
                className={`w-full rounded-lg border p-2.5 text-left transition-colors ${selected === d.id ? "border-blue-400 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex-1 truncate text-xs font-semibold text-gray-800">{d.name}</span>
                  <span className={`ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${STATUS[d.state].badge}`}>{STATUS[d.state].label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {d.vehicle && <span>{d.vehicle}</span>}
                  {d.zone && <span>{d.zone}</span>}
                  <span>{d.position ? since(d.lastSeen) : "position inconnue"}</span>
                  {d.orders.length > 0 && <span className="flex items-center gap-0.5 font-medium text-orange-500"><Package size={10} />{d.orders.length}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Détail du livreur sélectionné */}
          {selectedDriver && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-700">{selectedDriver.name}</p>
              {selectedDriver.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={11} /> <span className="select-all">{selectedDriver.phone}</span>
                </div>
              )}
              {selectedDriver.orders.map((o) => (
                <div key={o.orderId} className="rounded-lg bg-orange-50 px-2 py-1.5 text-xs text-orange-800">
                  <span className="font-mono">{o.orderId}</span>{o.address ? ` → ${o.address}` : ""}
                </div>
              ))}
              {address && (
                <div className="flex items-start gap-1.5 text-xs text-gray-400">
                  <MapPin size={11} className="mt-0.5 shrink-0" /><span>{address}</span>
                </div>
              )}
              {selectedDriver.position ? (
                <div className="flex gap-2">
                  {LOCATIONIQ_KEY && (
                    <button onClick={showRoute} disabled={loadingRoute}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:bg-blue-300">
                      {loadingRoute ? <Loader2 size={12} className="animate-spin" /> : <Route size={12} />} Itinéraire
                    </button>
                  )}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${selectedDriver.position.lat},${selectedDriver.position.lng}`}
                    target="_blank" rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                    <MapPin size={12} /> Google Maps
                  </a>
                  <a href={`https://waze.com/ul?ll=${selectedDriver.position.lat},${selectedDriver.position.lng}&navigate=yes`}
                    target="_blank" rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 py-1.5 text-xs font-medium text-white hover:bg-sky-600">
                    <Navigation size={12} /> Waze
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Position inconnue : elle apparaîtra dès que le livreur utilisera l&apos;application en livraison.</p>
              )}
              {routeInfo && (
                <div className="flex gap-2">
                  <span className="flex-1 rounded-lg bg-blue-50 py-1.5 text-center text-xs font-semibold text-blue-700">{routeInfo.distance}</span>
                  <span className="flex-1 rounded-lg bg-green-50 py-1.5 text-center text-xs font-semibold text-green-700">{routeInfo.duration}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
