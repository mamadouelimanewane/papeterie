"use client"

import { useEffect, useRef, useState } from "react"
import type * as Leaflet from "leaflet"
import { getTileUrl, TILE_ATTRIBUTION, LOCATIONIQ_KEY } from "@/lib/locationiq"

export interface MapMarker {
  id: string | number
  lat: number
  lng: number
  color: "green" | "orange" | "red" | "blue" | "gray" | "purple"
  title: string
  popup?: string
}

export interface MapRoute {
  coordinates: [number, number][]
  color?: string
}

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  routes?: MapRoute[]
  style?: "streets" | "satellite" | "hybrid"
  className?: string
  onMarkerClick?: (id: string | number) => void
  /** Recentre la carte sur les marqueurs à chaque changement de la liste d'identifiants. */
  fitToMarkers?: boolean
}

const COLOR_MAP: Record<string, string> = {
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  blue: "#3b82f6",
  gray: "#9ca3af",
  purple: "#a855f7",
}

/**
 * Tuiles : LocationIQ si une clé est configurée, sinon OpenStreetMap (plan) et Esri (satellite),
 * utilisables sans clé avec attribution — la carte fonctionne donc toujours.
 */
function tileConfig(style: "streets" | "satellite" | "hybrid") {
  if (LOCATIONIQ_KEY) return { url: getTileUrl(style), attribution: TILE_ATTRIBUTION, subdomains: ["eu1", "eu2"] }
  if (style === "streets") {
    return { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', subdomains: [] as string[] }
  }
  return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagerie &copy; Esri", subdomains: [] as string[],
  }
}

export default function LeafletMap({
  center = [14.6928, -17.4467],
  zoom = 12,
  markers = [],
  routes = [],
  style = "streets",
  className = "h-96",
  onMarkerClick,
  fitToMarkers = false,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const libRef = useRef<typeof Leaflet | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const tilesRef = useRef<Leaflet.TileLayer | null>(null)
  const markersRef = useRef<Leaflet.LayerGroup | null>(null)
  const routesRef = useRef<Leaflet.LayerGroup | null>(null)
  const clickRef = useRef(onMarkerClick)
  const [ready, setReady] = useState(false)

  useEffect(() => { clickRef.current = onMarkerClick }, [onMarkerClick])

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return
      libRef.current = L
      const map = L.map(containerRef.current, { center, zoom })
      mapRef.current = map
      markersRef.current = L.layerGroup().addTo(map)
      routesRef.current = L.layerGroup().addTo(map)
      setReady(true)
    }).catch(console.error)
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      tilesRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fond de carte (plan / satellite)
  useEffect(() => {
    const L = libRef.current, map = mapRef.current
    if (!ready || !L || !map) return
    tilesRef.current?.remove()
    const t = tileConfig(style)
    tilesRef.current = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19, ...(t.subdomains.length ? { subdomains: t.subdomains } : {}) }).addTo(map)
  }, [ready, style])

  // Marqueurs : redessinés à chaque mise à jour (positions en temps réel)
  const markersKey = JSON.stringify(markers)
  useEffect(() => {
    const L = libRef.current, layer = markersRef.current, map = mapRef.current
    if (!ready || !L || !layer || !map) return
    layer.clearLayers()
    markers.forEach((m) => {
      const color = COLOR_MAP[m.color] ?? COLOR_MAP.blue
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        className: "", iconSize: [16, 16], iconAnchor: [8, 8],
      })
      const marker = L.marker([m.lat, m.lng], { icon, title: m.title })
      if (m.popup) marker.bindPopup(m.popup)
      marker.on("click", () => clickRef.current?.(m.id))
      marker.addTo(layer)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markersKey])

  // Recentrage quand l'ensemble des livreurs affichés change (pas à chaque déplacement)
  const idsKey = markers.map((m) => m.id).join(",")
  useEffect(() => {
    const L = libRef.current, map = mapRef.current
    if (!fitToMarkers || !ready || !L || !map || markers.length === 0) return
    if (markers.length === 1) map.setView([markers[0].lat, markers[0].lng], 14)
    else map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey, fitToMarkers])

  // Itinéraires ([lng, lat] GeoJSON → [lat, lng] Leaflet)
  const routesKey = JSON.stringify(routes)
  useEffect(() => {
    const L = libRef.current, layer = routesRef.current
    if (!ready || !L || !layer) return
    layer.clearLayers()
    routes.forEach((route) => {
      if (route.coordinates.length < 2) return
      L.polyline(route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]), {
        color: route.color ?? "#3b82f6", weight: 4, opacity: 0.8,
      }).addTo(layer)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routesKey])

  return (
    <>
      {/* CSS Leaflet */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className={`${className} z-0 overflow-hidden rounded-xl`} />
    </>
  )
}
