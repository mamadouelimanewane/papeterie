"use client"

import CrudPage from "@/components/admin/CrudPage"
import { STATUS_OPTIONS } from "@/components/admin/FormModal"

const SEED = [
  { question: "Comment passer une commande ?", answer: "Rendez-vous sur la boutique en ligne ou l'application, ajoutez vos articles ou un kit de classe au panier, puis validez.", category: "Commandes", status: "Active" },
  { question: "Comment suivre ma livraison ?", answer: "Suivez votre livreur en temps réel depuis l'onglet « Mes commandes » de l'application.", category: "Livraison", status: "Active" },
  { question: "Quels moyens de paiement acceptez-vous ?", answer: "Paiement à la livraison (espèces), Wave, Orange Money et carte bancaire via Versus.", category: "Paiement", status: "Active" },
  { question: "Comment contacter le support ?", answer: "Écrivez-nous à contact@schoolmatik.sn ou via le formulaire de l'application.", category: "Support", status: "Active" },
]

export default function FaqsPage() {
  return (
    <CrudPage
      title="FAQ" icon="❓" itemLabel="une question" source="records/faqs" seed={SEED} exportName="faq"
      description="Questions fréquentes affichées dans l'application et sur la boutique."
      columns={[
        { key: "category", label: "Catégorie", render: (r) => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{String(r.category ?? "—")}</span> },
        { key: "question", label: "Question", className: "px-4 py-3 font-medium text-gray-800" },
        { key: "answer", label: "Réponse", className: "max-w-md px-4 py-3 text-xs text-gray-500" },
        { key: "status", label: "Statut" },
      ]}
      fields={[
        { key: "question", label: "Question", required: true, full: true },
        { key: "answer", label: "Réponse", type: "textarea", required: true },
        { key: "category", label: "Catégorie", type: "select", options: ["Commandes", "Livraison", "Paiement", "Compte", "Support"] },
        { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, required: true },
      ]}
    />
  )
}
