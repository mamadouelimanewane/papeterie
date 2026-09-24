"use client"

import { useSetting } from "@/hooks/useAdminData"
import { useAction } from "@/components/admin/Feedback"
import { Save, Map, Navigation, Key, Layers, AlertCircle, ExternalLink } from "lucide-react"

export default function MapConfigPage() {
  const { value: config, set: setKey, save, saving } = useSetting("map", {
    provider: "locationiq",
    locationiqKey: process.env.NEXT_PUBLIC_LOCATIONIQ_KEY ?? "",
    googleApiKey: "",
    mapboxToken: "",
    defaultLat: "14.6928",
    defaultLng: "-17.4467",
    defaultZoom: "12",
    minZoom: "8",
    maxZoom: "18",
    trackingInterval: "10",
    geofenceRadius: "2",
    showTraffic: false,
    showSatellite: false,
    clusterMarkers: true,
    autoFitBounds: true,
    showDriverRadius: true,
    driverRadiusKm: "3",
  })

  const set = (key: string, value: string | boolean) =>
    setKey(key as never, value as never)
  const run = useAction()

  const Toggle = ({ k }: { k: keyof typeof config }) => (
    <button
      onClick={() => set(k as string, !config[k])}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config[k] ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${config[k] ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
        <Map size={18} className="text-blue-600" /> Configuration Géolocalisation & Carte
      </h1>

      {/* Avertissement clé API */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <div>
          <strong>Clé API requise</strong> — Pour activer la carte interactive, configurez une clé Google Maps Platform ou un token Mapbox valide. Sans clé, l&apos;application utilise un fond de carte statique.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Fournisseur de carte */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Key size={15} className="text-blue-500" /> Fournisseur de carte
          </h2>
          <div className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">Fournisseur</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "locationiq", label: "LocationIQ", badge: "Recommandé", badgeColor: "bg-green-100 text-green-700" },
                  { value: "google", label: "Google Maps", badge: "Directions", badgeColor: "bg-blue-100 text-blue-700" },
                  { value: "waze", label: "Waze", badge: "Navigation", badgeColor: "bg-sky-100 text-sky-700" },
                  { value: "mapbox", label: "Mapbox", badge: "Vectoriel", badgeColor: "bg-purple-100 text-purple-700" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set("provider", opt.value)}
                    className={`py-2.5 px-3 text-sm rounded-lg border font-medium transition-colors text-left ${
                      config.provider === opt.value
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div>{opt.label}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-normal ${config.provider === opt.value ? "bg-white/20 text-white" : opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* LocationIQ — Défaut recommandé */}
            {config.provider === "locationiq" && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
                  <strong>LocationIQ</strong> — Géocodage, Directions, Autocomplete, Tuiles de carte. Basé sur OpenStreetMap. Plan gratuit disponible.
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Clé API LocationIQ <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={config.locationiqKey}
                    onChange={e => set("locationiqKey", e.target.value)}
                    type="password"
                    placeholder="pk.eyJ1IjoibG9jYXRpb25pcSJ9..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">Variable : <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_LOCATIONIQ_KEY</code></p>
                    <a href="https://locationiq.com/register" target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      Créer un compte gratuit <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { icon: "🗺️", label: "Tuiles de carte", status: "Inclus" },
                    { icon: "📍", label: "Géocodage", status: "5 000/j gratuit" },
                    { icon: "🧭", label: "Directions API", status: "5 000/j gratuit" },
                  ].map(f => (
                    <div key={f.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-base">{f.icon}</div>
                      <div className="font-medium text-gray-700">{f.label}</div>
                      <div className="text-green-600">{f.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps */}
            {config.provider === "google" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Clé API Google Maps</label>
                  <input
                    value={config.googleApiKey}
                    onChange={e => set("googleApiKey", e.target.value)}
                    type="password"
                    placeholder="AIzaSy..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Obtenir une clé sur <span className="text-blue-500">console.cloud.google.com</span></p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  <strong>APIs à activer :</strong> Maps JavaScript API, Directions API, Geocoding API, Places API
                </div>
              </div>
            )}

            {/* Waze — navigation uniquement */}
            {config.provider === "waze" && (
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 text-sm text-sky-800 space-y-2">
                <p><strong>Waze</strong> est utilisé uniquement pour la navigation livreur (lien externe).</p>
                <p className="text-xs text-sky-600">Le bouton &quot;Waze&quot; sur la carte des livreurs ouvre directement l&apos;application Waze avec la destination préremplie. Aucune clé API requise.</p>
                <code className="block bg-sky-100 rounded px-2 py-1 text-xs">
                  https://waze.com/ul?ll=&#123;lat&#125;,&#123;lng&#125;&navigate=yes
                </code>
              </div>
            )}

            {/* Mapbox */}
            {config.provider === "mapbox" && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Token Mapbox</label>
                <input
                  value={config.mapboxToken}
                  onChange={e => set("mapboxToken", e.target.value)}
                  type="password"
                  placeholder="pk.eyJ1Ijoi..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1">Obtenir un token sur <span className="text-blue-500">account.mapbox.com</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Position par défaut */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Navigation size={15} className="text-green-500" /> Position par défaut
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Latitude</label>
                <input
                  value={config.defaultLat}
                  onChange={e => set("defaultLat", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Longitude</label>
                <input
                  value={config.defaultLng}
                  onChange={e => set("defaultLng", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
              <span>📍</span> Coordonnées actuelles : Dakar, Sénégal (14.6928°N, 17.4467°O)
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Zoom défaut</label>
                <input
                  value={config.defaultZoom}
                  onChange={e => set("defaultZoom", e.target.value)}
                  type="number" min="1" max="20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Zoom min.</label>
                <input
                  value={config.minZoom}
                  onChange={e => set("minZoom", e.target.value)}
                  type="number" min="1" max="20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Zoom max.</label>
                <input
                  value={config.maxZoom}
                  onChange={e => set("maxZoom", e.target.value)}
                  type="number" min="1" max="20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Géolocalisation livreurs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Navigation size={15} className="text-orange-500" /> Suivi des livreurs
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Intervalle de mise à jour GPS (secondes)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="5" max="60" step="5"
                  value={config.trackingInterval}
                  onChange={e => set("trackingInterval", e.target.value)}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm font-semibold text-blue-600 w-12 text-right">{config.trackingInterval}s</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Recommandé : 10-15 secondes pour équilibrer précision et batterie</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Rayon d&apos;attribution des commandes (km)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="1" max="20" step="0.5"
                  value={config.driverRadiusKm}
                  onChange={e => set("driverRadiusKm", e.target.value)}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm font-semibold text-blue-600 w-12 text-right">{config.driverRadiusKm} km</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Rayon géofence (km)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0.5" max="10" step="0.5"
                  value={config.geofenceRadius}
                  onChange={e => set("geofenceRadius", e.target.value)}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-sm font-semibold text-orange-600 w-12 text-right">{config.geofenceRadius} km</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Zone de détection d&apos;arrivée à destination</p>
            </div>
          </div>
        </div>

        {/* Options d'affichage */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Layers size={15} className="text-purple-500" /> Options d&apos;affichage
          </h2>
          <div className="space-y-4">
            {[
              { key: "showTraffic" as const, label: "Afficher le trafic en temps réel", desc: "Couche trafic Google Maps" },
              { key: "showSatellite" as const, label: "Vue satellite par défaut", desc: "Fond de carte satellite au lieu du plan" },
              { key: "clusterMarkers" as const, label: "Regrouper les marqueurs (clustering)", desc: "Regroupe les marqueurs proches à faible zoom" },
              { key: "autoFitBounds" as const, label: "Ajuster la vue automatiquement", desc: "La carte s'ajuste pour afficher tous les livreurs actifs" },
              { key: "showDriverRadius" as const, label: "Afficher le rayon livreur", desc: "Cercle de rayon autour de chaque livreur actif" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <Toggle k={key} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prévisualisation coordonnées */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Prévisualisation de la configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Fournisseur", value: config.provider === "google" ? "Google Maps" : config.provider === "mapbox" ? "Mapbox" : "OpenStreetMap" },
            { label: "Centre (lat, lng)", value: `${config.defaultLat}, ${config.defaultLng}` },
            { label: "Zoom défaut / plage", value: `${config.defaultZoom} (${config.minZoom}–${config.maxZoom})` },
            { label: "Mise à jour GPS", value: `${config.trackingInterval}s` },
            { label: "Rayon attribution", value: `${config.driverRadiusKm} km` },
            { label: "Géofence", value: `${config.geofenceRadius} km` },
            { label: "Clustering", value: config.clusterMarkers ? "Activé" : "Désactivé" },
            { label: "Rayon livreur", value: config.showDriverRadius ? "Visible" : "Masqué" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => run(() => save(), "Configuration de la carte enregistrée")} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-60">
          <Save size={15} /> {saving ? "Enregistrement…" : "Enregistrer la configuration"}
        </button>
      </div>
    </div>
  )
}
