"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { fmtDate } from "@/lib/adminApi"

const SEED = [
  { name: "Sénégal", code: "SN", flag: "🇸🇳", phoneCode: "+221", currency: "Franc CFA", currencySymbol: "FCFA", status: "Active" },
  { name: "Gambie", code: "GM", flag: "🇬🇲", phoneCode: "+220", currency: "Dalasi", currencySymbol: "D", status: "Inactive" },
  { name: "Mali", code: "ML", flag: "🇲🇱", phoneCode: "+223", currency: "Franc CFA", currencySymbol: "FCFA", status: "Inactive" },
]

export default function CountriesPage() {
  return (
    <CrudPage
      title="Pays" icon="🌍" itemLabel="un pays" source="crud/countries" seed={SEED} exportName="pays"
      columns={[
        { key: "flag", label: "Drapeau", className: "px-4 py-3 text-2xl" },
        { key: "name", label: "Nom", className: "whitespace-nowrap px-4 py-3 font-medium text-gray-800" },
        { key: "code", label: "Code", className: "px-4 py-3 font-mono text-gray-600" },
        { key: "phoneCode", label: "Indicatif" },
        { key: "currency", label: "Devise" },
        { key: "currencySymbol", label: "Symbole" },
        { key: "status", label: "Statut" },
        { key: "createdAt", label: "Créé le", render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.createdAt)}</span> },
      ]}
      fields={[
        { key: "name", label: "Nom", required: true },
        { key: "code", label: "Code ISO (2 lettres)", required: true, placeholder: "SN" },
        { key: "flag", label: "Drapeau (emoji)", placeholder: "🇸🇳" },
        { key: "phoneCode", label: "Indicatif", placeholder: "+221" },
        { key: "currency", label: "Devise", placeholder: "Franc CFA" },
        { key: "currencySymbol", label: "Symbole", placeholder: "FCFA" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      fromForm={(v) => ({ ...v, code: String(v.code ?? "").toUpperCase().slice(0, 3) })}
    />
  )
}
