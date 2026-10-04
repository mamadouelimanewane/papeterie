"use client"

import SettingsPage from "@/components/admin/SettingsPage"

const DEFAULTS = {
  androidUserApp: "", iosUserApp: "", androidDriverApp: "", iosDriverApp: "",
  websiteUrl: "https://papeterie.vercel.app/shop", adminPanelUrl: "https://papeterie.vercel.app/dashboard",
  apiBaseUrl: "https://papeterie.vercel.app/api", supportWhatsapp: "",
}

export default function AppUrlPage() {
  return (
    <SettingsPage
      settingKey="app-urls" title="URLs de l'application" defaults={DEFAULTS}
      description="Liens de téléchargement des applications et adresses web, utilisés dans les e-mails et la boutique."
      sections={[
        { title: "Application client", fields: [
          { key: "androidUserApp", label: "Android (Play Store)", type: "url", placeholder: "https://play.google.com/store/apps/details?id=…" },
          { key: "iosUserApp", label: "iOS (App Store)", type: "url", placeholder: "https://apps.apple.com/…" },
        ] },
        { title: "Application livreur", fields: [
          { key: "androidDriverApp", label: "Android (Play Store)", type: "url" },
          { key: "iosDriverApp", label: "iOS (App Store)", type: "url" },
        ] },
        { title: "Liens web", fields: [
          { key: "websiteUrl", label: "Boutique en ligne", type: "url" },
          { key: "adminPanelUrl", label: "Back-office", type: "url" },
          { key: "apiBaseUrl", label: "URL de base de l'API", type: "url" },
        ] },
        { title: "Support", fields: [
          { key: "supportWhatsapp", label: "Numéro WhatsApp du support", type: "tel", placeholder: "+221 77 000 00 00" },
        ] },
      ]}
    />
  )
}
