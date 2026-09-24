"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { name: "Pièce d'identité", required: true, expiry: true, status: "Active" },
  { name: "Permis de conduire", required: true, expiry: true, status: "Active" },
  { name: "Carte grise", required: true, expiry: true, status: "Active" },
  { name: "Assurance véhicule", required: false, expiry: true, status: "Active" },
  { name: "Photo de profil", required: true, expiry: false, status: "Active" },
]

const YesNo = ({ v }: { v: unknown }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{v ? "Oui" : "Non"}</span>
)

export default function DocumentsPage() {
  return (
    <CrudPage
      title="Types de documents" icon="📄" itemLabel="un type de document" source="records/documents" seed={SEED} exportName="types-documents"
      description="Documents demandés aux livreurs lors de leur inscription."
      columns={[
        { key: "name", label: "Nom du document", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "required", label: "Obligatoire", render: (r) => <YesNo v={r.required} />, csv: (r) => (r.required ? "Oui" : "Non") },
        { key: "expiry", label: "Expiration", render: (r) => <YesNo v={r.expiry} />, csv: (r) => (r.expiry ? "Oui" : "Non") },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "name", label: "Nom du document", required: true, full: true },
        { key: "required", label: "Obligatoire", type: "checkbox", placeholder: "Document obligatoire" },
        { key: "expiry", label: "Expiration", type: "checkbox", placeholder: "A une date d'expiration" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
    />
  )
}
