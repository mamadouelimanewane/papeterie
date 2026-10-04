"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Découverte", price: 0, duration: "Gratuit", features: "Commande en ligne\nSuivi de livraison", status: "Active" },
  { name: "Famille", price: 2500, duration: "Mensuel", features: "Livraison gratuite dès 10 000 FCFA\n-5 % sur les kits\nSupport prioritaire", status: "Active" },
  { name: "École", price: 25000, duration: "Annuel", features: "Commandes groupées par classe\nFacturation mensuelle\nInterlocuteur dédié", status: "Active" },
]
const features = (v: unknown) => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean)

export default function MembershipPage() {
  return (
    <CrudPage
      title="Plans d'abonnement" icon="⚙️" itemLabel="un plan" source="records/membership-plans" seed={SEED} exportName="plans-abonnement"
      columns={[
        { key: "name", label: "Plan", className: "px-4 py-3 font-semibold text-gray-800" },
        { key: "price", label: "Prix", render: (r) => <span className="font-medium text-green-600">{Number(r.price) ? `${Number(r.price).toLocaleString("fr-FR")} FCFA` : "Gratuit"}</span> },
        { key: "duration", label: "Durée" },
        { key: "features", label: "Avantages", render: (r) => (
          <ul className="space-y-0.5">{features(r.features).map((f) => <li key={f} className="text-xs text-gray-600"><span className="text-green-500">✓</span> {f}</li>)}</ul>
        ), csv: (r) => features(r.features).join(" | ") },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom du plan", required: true },
        { key: "price", label: "Prix (FCFA)", type: "number", min: 0, required: true },
        { key: "duration", label: "Durée", type: "select", options: ["Gratuit", "Mensuel", "Trimestriel", "Annuel"], required: true },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
        { key: "features", label: "Avantages (un par ligne)", type: "textarea" },
      ]}
      defaults={{ duration: "Mensuel", price: 0 }}
      fromForm={(v) => ({ ...v, price: Number(v.price ?? 0) })}
    />
  )
}
