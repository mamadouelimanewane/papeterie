"use client"

import SettingsPage from "@/components/admin/SettingsPage"

const DEFAULTS = {
  autoAssign: true, assignRadius: 5, maxDriverSearch: 10, searchTimeout: 60, driverAcceptTimeout: 30,
  allowScheduled: true, scheduledAdvanceHours: 24, maxItemsPerOrder: 50, allowTips: false, tipOptions: "5,10,15",
}

export default function RequestConfigPage() {
  return (
    <SettingsPage
      settingKey="requests" title="Configuration des commandes" defaults={DEFAULTS}
      sections={[
        { title: "Attribution des livreurs", fields: [
          { key: "autoAssign", label: "Attribution automatique", type: "checkbox" },
          { key: "assignRadius", label: "Rayon de recherche (km)", type: "number", min: 1 },
          { key: "maxDriverSearch", label: "Nombre max. de livreurs contactés", type: "number", min: 1 },
          { key: "searchTimeout", label: "Délai de recherche (secondes)", type: "number", min: 10 },
          { key: "driverAcceptTimeout", label: "Délai d'acceptation du livreur (secondes)", type: "number", min: 10 },
        ] },
        { title: "Options de commande", fields: [
          { key: "maxItemsPerOrder", label: "Nombre max. d'articles par commande", type: "number", min: 1 },
          { key: "allowScheduled", label: "Commandes planifiées", type: "checkbox" },
          { key: "scheduledAdvanceHours", label: "Délai min. d'une commande planifiée (heures)", type: "number", min: 1 },
          { key: "allowTips", label: "Pourboires", type: "checkbox" },
          { key: "tipOptions", label: "Options de pourboire (%, séparées par des virgules)", placeholder: "5,10,15" },
        ] },
      ]}
    />
  )
}
