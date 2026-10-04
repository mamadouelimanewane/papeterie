"use client"

import SettingsPage from "@/components/admin/SettingsPage"

const DEFAULTS = {
  minRating: 3.5, maxActiveOrders: 3, lowRatingThreshold: 2.5, allowMultipleOrders: true, autoSuspendOnLowRating: true,
  commissionRate: 15, bonusPerOrder: 200, cashoutMinAmount: 5000, cashoutMaxAmount: 500000, cashoutFrequency: "Weekly", documentValidityDays: 365,
}

export default function DriverConfigPage() {
  return (
    <SettingsPage
      settingKey="driver" title="Configuration livreurs" defaults={DEFAULTS}
      sections={[
        { title: "Performance & commandes", fields: [
          { key: "minRating", label: "Note minimale requise", type: "number", step: "0.1", min: 0 },
          { key: "maxActiveOrders", label: "Commandes simultanées max.", type: "number", min: 1 },
          { key: "lowRatingThreshold", label: "Seuil de note faible", type: "number", step: "0.1", min: 0 },
          { key: "allowMultipleOrders", label: "Commandes multiples autorisées", type: "checkbox" },
          { key: "autoSuspendOnLowRating", label: "Suspension automatique si note faible", type: "checkbox" },
        ] },
        { title: "Paiements & documents", fields: [
          { key: "commissionRate", label: "Commission plateforme (% par livraison)", type: "number", min: 0 },
          { key: "bonusPerOrder", label: "Bonus par livraison (FCFA)", type: "number", min: 0 },
          { key: "cashoutMinAmount", label: "Retrait minimum (FCFA)", type: "number", min: 0 },
          { key: "cashoutMaxAmount", label: "Retrait maximum (FCFA)", type: "number", min: 0 },
          { key: "cashoutFrequency", label: "Fréquence des retraits", type: "select", required: true, options: [
            { value: "Daily", label: "Quotidienne" }, { value: "Weekly", label: "Hebdomadaire" }, { value: "Monthly", label: "Mensuelle" },
          ] },
          { key: "documentValidityDays", label: "Validité des documents (jours)", type: "number", min: 1 },
        ] },
      ]}
    />
  )
}
