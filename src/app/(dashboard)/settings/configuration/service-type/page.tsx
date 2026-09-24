"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Fournitures scolaires", code: "SUPPLIES", icon: "✏️", description: "Cahiers, stylos, géométrie, cartables…", status: "Active" },
  { name: "Livres & manuels", code: "BOOKS", icon: "📚", description: "Manuels scolaires officiels par classe", status: "Active" },
  { name: "Kits par classe", code: "KITS", icon: "🎒", description: "Liste complète de fournitures d'une classe", status: "Active" },
  { name: "Impression & photocopie", code: "PRINT", icon: "🖨️", description: "Service d'impression à la demande", status: "Inactive" },
]

export default function ServiceTypePage() {
  return (
    <CrudPage
      title="Types de service" icon="⚙️" itemLabel="un type de service" source="records/service-types" seed={SEED} exportName="types-service"
      columns={[
        { key: "name", label: "Service", render: (r) => <span className="flex items-center gap-2"><span className="text-xl">{String(r.icon ?? "")}</span><span className="font-semibold text-gray-800">{String(r.name)}</span></span> },
        { key: "code", label: "Code", render: (r) => <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{String(r.code ?? "")}</code> },
        { key: "description", label: "Description", className: "px-4 py-3 text-xs text-gray-600" },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "code", label: "Code", required: true },
        { key: "icon", label: "Icône (emoji)" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      fromForm={(v) => ({ ...v, code: String(v.code ?? "").toUpperCase() })}
    />
  )
}
