"use client"

import { Info } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import { useFeedback } from "@/components/admin/Feedback"
import { fmtDate } from "@/lib/adminApi"

const TYPES = [{ value: "Percentage", label: "Pourcentage (%)" }, { value: "Fixed", label: "Montant fixe (FCFA)" }]

export default function PromoCodePage() {
  const { toast } = useFeedback()
  return (
    <CrudPage
      title="Codes promo" icon="🏷️" itemLabel="un code promo" source="crud/promo-codes" exportName="codes-promo"
      description="Codes saisis par le client dans le panier de la boutique en ligne."
      headerActions={() => (
        <button onClick={() => toast("Le client saisit le code dans son panier. Le code doit être Actif, non expiré et sous sa limite d'utilisations. Pourcentage = remise sur les articles ; Fixe = montant déduit en FCFA.", "info")}
          title="Comment ça marche ?" className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500 text-white hover:bg-blue-600"><Info size={16} /></button>
      )}
      columns={[
        { key: "code", label: "Code", render: (r) => <span className="rounded bg-gray-50 px-2 py-0.5 font-mono font-bold text-gray-800">{String(r.code)}</span> },
        { key: "discount", label: "Remise", render: (r) => <span className="font-semibold text-green-600">{String(r.discount)}{r.type === "Percentage" ? " %" : " FCFA"}</span> },
        { key: "type", label: "Type", render: (r) => (r.type === "Percentage" ? "Pourcentage" : "Fixe") },
        { key: "maxUses", label: "Utilisations max.", render: (r) => String(r.maxUses ?? "∞") },
        { key: "usedCount", label: "Utilisé" },
        { key: "expiresAt", label: "Expiration", render: (r) => <span className="text-xs text-gray-500">{r.expiresAt ? fmtDate(r.expiresAt).slice(0, 10) : "Sans expiration"}</span> },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "code", label: "Code", required: true, placeholder: "RENTREE2026" },
        { key: "type", label: "Type", type: "select", options: TYPES, required: true },
        { key: "discount", label: "Remise", type: "number", min: 0, required: true },
        { key: "maxUses", label: "Utilisations max.", type: "number", min: 1, help: "Vide = illimité" },
        { key: "expiresAt", label: "Date d'expiration", type: "date", help: "Vide = sans expiration" },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
      defaults={{ type: "Percentage" }}
      fromForm={(v) => ({ ...v, code: String(v.code ?? "").toUpperCase().replace(/\s+/g, "") })}
    />
  )
}
