"use client"

import { useState } from "react"
import { Eye, X } from "lucide-react"
import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"
import type { Row } from "@/hooks/useAdminData"

const EVENTS = ["user_register", "order_placed", "order_delivered", "order_cancelled", "password_reset", "driver_register", "driver_approved", "driver_rejected"]
const SAMPLE: Record<string, string> = { name: "Awa Diop", order_id: "SCH-1042", total: "12 500 FCFA", store: "Schoolmatik Librairie", link: "https://papeterie.vercel.app/shop" }
const fill = (s: unknown) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => SAMPLE[k] ?? `{${k}}`)

const SEED = [
  { name: "Bienvenue client", event: "user_register", subject: "Bienvenue chez Schoolmatik, {name} !", body: "Bonjour {name},\n\nMerci pour votre inscription. Retrouvez tous vos livres et fournitures sur {link}.\n\nL'équipe {store}", status: "Active" },
  { name: "Confirmation de commande", event: "order_placed", subject: "Commande {order_id} confirmée", body: "Bonjour {name},\n\nNous avons bien reçu votre commande {order_id} d'un montant de {total}. Nous vous prévenons dès qu'elle part en livraison.\n\nL'équipe {store}", status: "Active" },
  { name: "Commande livrée", event: "order_delivered", subject: "Votre commande {order_id} a été livrée", body: "Bonjour {name},\n\nVotre commande {order_id} vient d'être livrée. Bonne rentrée !\n\nL'équipe {store}", status: "Active" },
  { name: "Réinitialisation du mot de passe", event: "password_reset", subject: "Réinitialiser votre mot de passe", body: "Bonjour {name},\n\nCliquez sur le lien suivant pour choisir un nouveau mot de passe : {link}", status: "Active" },
  { name: "Livreur approuvé", event: "driver_approved", subject: "Votre compte livreur est validé", body: "Bonjour {name},\n\nVos documents ont été approuvés : vous pouvez maintenant recevoir des commandes.", status: "Active" },
  { name: "Livreur rejeté", event: "driver_rejected", subject: "Documents refusés — action requise", body: "Bonjour {name},\n\nCertains de vos documents n'ont pas pu être validés. Merci de les renvoyer depuis l'application.", status: "Inactive" },
]

export default function EmailTemplatesPage() {
  const [preview, setPreview] = useState<Row | null>(null)
  return (
    <>
      <CrudPage
        title="Modèles d'e-mail" icon="⚙️" itemLabel="un modèle" source="records/email-templates" seed={SEED} exportName="modeles-email"
        description="Variables disponibles : {name}, {order_id}, {total}, {store}, {link}."
        columns={[
          { key: "name", label: "Modèle", className: "px-4 py-3 font-medium text-gray-800" },
          { key: "event", label: "Événement", render: (r) => <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">{String(r.event)}</code> },
          { key: "subject", label: "Sujet", className: "px-4 py-3 text-gray-600" },
          { key: "status", label: "Statut" },
        ]}
        rowActions={(r) => <button onClick={() => setPreview(r)} title="Aperçu" className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600"><Eye size={12} /></button>}
        fields={[
          { key: "name", label: "Nom du modèle", required: true },
          { key: "event", label: "Événement déclencheur", type: "select", options: EVENTS, required: true },
          { key: "subject", label: "Sujet", required: true, full: true },
          { key: "body", label: "Contenu", type: "textarea", required: true },
          { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
        ]}
        defaults={{ event: EVENTS[0] }}
      />
      {preview && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold text-gray-800">{String(preview.name)}</h2>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600" aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-4">
              <div className="text-xs text-gray-500">Événement : <code className="rounded bg-gray-100 px-2 py-0.5">{String(preview.event)}</code></div>
              <div className="text-sm"><span className="text-xs text-gray-500">Sujet : </span><span className="font-medium">{fill(preview.subject)}</span></div>
              <div className="min-h-[120px] whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{fill(preview.body)}</div>
              <p className="text-[11px] text-gray-400">Aperçu avec des données d&apos;exemple.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
