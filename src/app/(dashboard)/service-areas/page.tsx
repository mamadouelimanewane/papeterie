"use client"

import { MapPin } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { useOptions } from "@/hooks/useAdminData"

const SEED = [
  { name: "Dakar", country: "Sénégal", lat: 14.6928, lng: -17.4467, radiusKm: 15, deliveryFee: 500, status: "Active" },
  { name: "Pikine", country: "Sénégal", lat: 14.7456, lng: -17.3957, radiusKm: 8, deliveryFee: 600, status: "Active" },
  { name: "Guédiawaye", country: "Sénégal", lat: 14.7712, lng: -17.3987, radiusKm: 7, deliveryFee: 650, status: "Active" },
  { name: "Rufisque", country: "Sénégal", lat: 14.7154, lng: -17.2727, radiusKm: 10, deliveryFee: 750, status: "Inactive" },
]

export default function ServiceAreasPage() {
  const countries = useOptions("crud/countries")
  return (
    <CrudPage
      title="Zones de service" icon={<MapPin size={18} className="inline text-blue-600" />} itemLabel="une zone" source="crud/service-areas" seed={SEED} exportName="zones-service"
      description="Zones de livraison couvertes, avec leur rayon et leurs frais de livraison."
      columns={[
        { key: "name", label: "Zone", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "country", label: "Pays" },
        { key: "lat", label: "Coordonnées", render: (r) => r.lat != null ? (
          <a className="font-mono text-xs text-indigo-600 underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=13/${r.lat}/${r.lng}`}>{String(r.lat)}, {String(r.lng)}</a>
        ) : "—", csv: (r) => (r.lat != null ? `${r.lat}, ${r.lng}` : "") },
        { key: "radiusKm", label: "Rayon (km)" },
        { key: "deliveryFee", label: "Frais de livraison (FCFA)", render: (r) => r.deliveryFee != null ? Number(r.deliveryFee).toLocaleString("fr-FR") : "—" },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom de la zone", required: true, placeholder: "Thiès" },
        { key: "country", label: "Pays", type: "select", options: countries.length ? countries : ["Sénégal"], required: true },
        { key: "lat", label: "Latitude", type: "number", step: "any", placeholder: "14.6928" },
        { key: "lng", label: "Longitude", type: "number", step: "any", placeholder: "-17.4467" },
        { key: "radiusKm", label: "Rayon (km)", type: "number", step: "any", min: 0 },
        { key: "deliveryFee", label: "Frais de livraison (FCFA)", type: "number", min: 0 },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ country: "Sénégal", radiusKm: 10, deliveryFee: 500 }}
    />
  )
}
