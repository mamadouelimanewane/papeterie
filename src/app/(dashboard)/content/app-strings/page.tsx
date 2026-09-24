"use client"

import CrudPage from "@/components/admin/CrudPage"

const SEED = [
  { key: "app.welcome", section: "Général", value: "Bienvenue chez Schoolmatik", en: "Welcome to Schoolmatik" },
  { key: "app.tagline", section: "Général", value: "Fournitures et livres scolaires livrés à Dakar", en: "School supplies and books delivered in Dakar" },
  { key: "order.placed", section: "Commandes", value: "Votre commande a été passée avec succès", en: "Your order has been placed" },
  { key: "order.confirmed", section: "Commandes", value: "Commande confirmée par la librairie", en: "Order confirmed by the bookshop" },
  { key: "order.picked_up", section: "Commandes", value: "Livreur en route vers vous", en: "Your rider is on the way" },
  { key: "order.delivered", section: "Commandes", value: "Commande livrée !", en: "Order delivered!" },
  { key: "order.cancelled", section: "Commandes", value: "Commande annulée", en: "Order cancelled" },
  { key: "driver.online", section: "Livreur", value: "Vous êtes en ligne", en: "You are online" },
  { key: "driver.offline", section: "Livreur", value: "Vous êtes hors ligne", en: "You are offline" },
  { key: "driver.new_order", section: "Livreur", value: "Nouvelle commande disponible", en: "New order available" },
  { key: "payment.success", section: "Paiement", value: "Paiement effectué avec succès", en: "Payment successful" },
  { key: "payment.failed", section: "Paiement", value: "Échec du paiement", en: "Payment failed" },
]

export default function AppStringsPage() {
  return (
    <CrudPage
      title="Textes de l'application" icon="📱" itemLabel="un texte" source="records/app-strings" seed={SEED} exportName="textes-application"
      description="Messages affichés dans les applications mobiles, en français et en anglais."
      statusKey={null}
      columns={[
        { key: "section", label: "Section", render: (r) => <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{String(r.section ?? "")}</span> },
        { key: "key", label: "Clé", className: "px-4 py-3 font-mono text-xs text-indigo-600" },
        { key: "value", label: "Texte (FR)", className: "px-4 py-3 text-gray-800" },
        { key: "en", label: "Texte (EN)", className: "px-4 py-3 text-gray-500" },
      ]}
      fields={[
        { key: "key", label: "Clé", required: true, placeholder: "order.placed" },
        { key: "section", label: "Section", type: "select", options: ["Général", "Commandes", "Livreur", "Paiement", "Compte"], required: true },
        { key: "value", label: "Texte (français)", type: "textarea", required: true },
        { key: "en", label: "Texte (anglais)", type: "textarea" },
      ]}
      defaults={{ section: "Général" }}
      fromForm={(v) => ({ ...v, key: String(v.key ?? "").trim().toLowerCase().replace(/\s+/g, "_") })}
    />
  )
}
