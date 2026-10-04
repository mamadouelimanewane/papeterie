"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Espèces à la livraison", icon: "💵", code: "cash", order: 1, status: "Active" },
  { name: "Versus Fintech (Wave, Orange Money, carte)", icon: "💳", code: "versus", order: 2, status: "Active" },
  { name: "Wave direct", icon: "🔵", code: "wave", order: 3, status: "Inactive" },
  { name: "Orange Money direct", icon: "🟠", code: "orange_money", order: 4, status: "Inactive" },
]

export default function PaymentOptionsPage() {
  return (
    <CrudPage
      title="Options de paiement (affichage)" icon="💳" itemLabel="une option de paiement" source="records/payment-options" seed={SEED} exportName="options-paiement"
      description="Libellés et ordre des moyens de paiement présentés au client. Cliquez sur le statut pour activer / désactiver."
      columns={[
        { key: "order", label: "Ordre" },
        { key: "name", label: "Option", render: (r) => <span className="flex items-center gap-2"><span className="text-xl">{String(r.icon ?? "")}</span><span className="font-medium text-gray-800">{String(r.name)}</span></span> },
        { key: "code", label: "Code", className: "px-4 py-3 font-mono text-xs text-gray-600" },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Libellé", required: true, full: true },
        { key: "icon", label: "Icône (emoji)" },
        { key: "code", label: "Code", required: true },
        { key: "order", label: "Ordre d'affichage", type: "number", min: 1 },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      fromForm={(v) => ({ ...v, order: v.order ? Number(v.order) : null, code: String(v.code ?? "").toLowerCase() })}
    />
  )
}
