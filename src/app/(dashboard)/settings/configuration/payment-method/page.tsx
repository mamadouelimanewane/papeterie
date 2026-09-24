"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Paiement à la livraison", code: "CASH", icon: "💵", type: "Offline", status: "Active" },
  { name: "Wave (via Versus)", code: "WAVE", icon: "🔵", type: "Mobile Money", status: "Active" },
  { name: "Orange Money (via Versus)", code: "OM", icon: "🟠", type: "Mobile Money", status: "Active" },
  { name: "Carte bancaire (via Versus)", code: "CARD", icon: "💳", type: "Card", status: "Active" },
  { name: "Mixx by Yas (via Versus)", code: "MIXX", icon: "🟢", type: "Mobile Money", status: "Inactive" },
]
const TYPES = [{ value: "Offline", label: "Hors ligne" }, { value: "Mobile Money", label: "Mobile Money" }, { value: "Card", label: "Carte" }]

export default function PaymentMethodPage() {
  return (
    <CrudPage
      title="Méthodes de paiement" icon="⚙️" itemLabel="une méthode de paiement" source="records/payment-methods" seed={SEED} exportName="methodes-paiement"
      description="Moyens de paiement proposés au client. Les paiements en ligne passent par Versus Fintech."
      columns={[
        { key: "name", label: "Méthode", render: (r) => <span className="flex items-center gap-2"><span className="text-xl">{String(r.icon ?? "")}</span><span className="font-semibold text-gray-800">{String(r.name)}</span></span> },
        { key: "code", label: "Code", className: "px-4 py-3 font-mono text-xs text-gray-600" },
        { key: "type", label: "Type", render: (r) => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{String(r.type ?? "")}</span> },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "code", label: "Code", required: true },
        { key: "icon", label: "Icône (emoji)" },
        { key: "type", label: "Type", type: "select", options: TYPES, required: true },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ type: "Mobile Money" }}
    />
  )
}
