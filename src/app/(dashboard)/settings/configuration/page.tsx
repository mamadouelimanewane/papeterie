"use client"

import SettingsPage from "@/components/admin/SettingsPage"
import type { Field } from "@/components/admin/FormModal"

const LANGS = [{ value: "fr", label: "Français" }, { value: "en", label: "English" }]
const app = (p: string): Field[] => [
  { key: `${p}Maintenance`, label: "Mode maintenance", type: "checkbox" },
  { key: `${p}Version`, label: "Version minimale de l'application", placeholder: "1.0.0" },
  { key: `${p}Mandatory`, label: "Mise à jour obligatoire", type: "checkbox" },
]

const DEFAULTS = {
  storeName: "Schoolmatik Librairie", reportEmail: "contact@schoolmatik.sn", reportPhone: "", currency: "FCFA", commissionPct: 10, defaultDeliveryFee: 500,
  androidUserMaintenance: false, androidUserVersion: "1.0.0", androidUserMandatory: false,
  androidDriverMaintenance: false, androidDriverVersion: "1.0.0", androidDriverMandatory: false,
  iosUserMaintenance: false, iosUserVersion: "1.0.0", iosUserMandatory: false,
  iosDriverMaintenance: false, iosDriverVersion: "1.0.0", iosDriverMandatory: false,
  adminLang: "fr", userLang: "fr", driverLang: "fr",
  docExpiryDays: 30, userImageMode: "Optional",
  userDeleteUrl: "", driverDeleteUrl: "",
  logo: "", appTheme: "#4F46E5", screen1Text: "Tous vos livres et fournitures, livrés à Dakar",
}

export default function GeneralConfigurationPage() {
  return (
    <SettingsPage
      settingKey="general" title="Configuration générale" defaults={DEFAULTS}
      description="Paramètres de la plateforme. La commission est utilisée par le rapport des revenus."
      sections={[
        { title: "Boutique & contact", fields: [
          { key: "storeName", label: "Nom affiché", required: true },
          { key: "reportEmail", label: "E-mail de signalement de problème", type: "email" },
          { key: "reportPhone", label: "Téléphone de signalement de problème", type: "tel" },
          { key: "currency", label: "Devise", type: "select", options: ["FCFA", "EUR", "USD"], required: true },
        ] },
        { title: "Commission & livraison", fields: [
          { key: "commissionPct", label: "Commission plateforme (%)", type: "number", step: "0.5", min: 0 },
          { key: "defaultDeliveryFee", label: "Frais de livraison par défaut (FCFA)", type: "number", min: 0 },
          { key: "docExpiryDays", label: "Rappel avant expiration des documents (jours)", type: "number", min: 1 },
        ] },
        { title: "Application client — Android", fields: app("androidUser") },
        { title: "Application livreur — Android", fields: app("androidDriver") },
        { title: "Application client — iOS", fields: app("iosUser") },
        { title: "Application livreur — iOS", fields: app("iosDriver") },
        { title: "Langues par défaut", fields: [
          { key: "adminLang", label: "Back-office", type: "select", options: LANGS, required: true, help: "Chaque administrateur peut aussi changer de langue dans l'en-tête." },
          { key: "userLang", label: "Application client", type: "select", options: LANGS, required: true },
          { key: "driverLang", label: "Application livreur", type: "select", options: LANGS, required: true },
        ] },
        { title: "Comptes", fields: [
          { key: "userImageMode", label: "Photo de profil client", type: "select", required: true, options: [{ value: "Optional", label: "Facultative" }, { value: "Mandatory", label: "Obligatoire" }] },
          { key: "userDeleteUrl", label: "URL de suppression de compte client", type: "url", help: "Exigée par Google Play / App Store." },
          { key: "driverDeleteUrl", label: "URL de suppression de compte livreur", type: "url" },
        ] },
        { title: "Apparence", fields: [
          { key: "logo", label: "Logo", type: "image" },
          { key: "appTheme", label: "Couleur principale", type: "color" },
          { key: "screen1Text", label: "Texte de l'écran d'accueil", full: true },
        ] },
      ]}
    />
  )
}
