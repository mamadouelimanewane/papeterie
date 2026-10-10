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
  promotionsEnabled: false,
  deliveryMode: "Fixed", deliveryStoreLat: "", deliveryStoreLng: "", deliveryBaseKm: 2, deliveryPerKm: 150, deliveryMaxKm: 25, deliveryMaxFee: 5000, deliveryRoadFactor: 1.3, deliveryFreeAbove: 0,
  androidUserMaintenance: false, androidUserVersion: "1.0.0", androidUserMandatory: false,
  androidDriverMaintenance: false, androidDriverVersion: "1.0.0", androidDriverMandatory: false,
  iosUserMaintenance: false, iosUserVersion: "1.0.0", iosUserMandatory: false,
  iosDriverMaintenance: false, iosDriverVersion: "1.0.0", iosDriverMandatory: false,
  adminLang: "fr", userLang: "fr", driverLang: "fr",
  docExpiryDays: 30, userImageMode: "Optional",
  userDeleteUrl: "", driverDeleteUrl: "",
  legalName: "", legalAddress: "", legalPhone: "", ninea: "", rccm: "",
  receiptFooter: "Merci pour votre confiance et bonne rentrée !",
  logo: "", appTheme: "#C61620", screen1Text: "Tous vos livres et fournitures, livrés à Dakar",
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
        { title: "Reçu client", description: "Informations imprimées sur le reçu remis au client après paiement. Les champs vides n'apparaissent pas. Le logo utilisé est celui réglé plus bas sur cette page.", fields: [
          { key: "legalName", label: "Raison sociale", placeholder: "Ex. SCHOOLMATIK SARL" },
          { key: "legalAddress", label: "Adresse du siège", placeholder: "Ex. 12 rue X, Dakar-Plateau", help: "Vide : adresse de la boutique." },
          { key: "legalPhone", label: "Téléphone service client", type: "tel", help: "Vide : téléphone de la boutique." },
          { key: "ninea", label: "NINEA" },
          { key: "rccm", label: "RCCM", placeholder: "Ex. SN-DKR-2024-B-12345" },
          { key: "receiptFooter", label: "Message en bas du reçu", type: "textarea" },
        ] },
        { title: "Commission & livraison", fields: [
          { key: "commissionPct", label: "Commission plateforme (%)", type: "number", step: "0.5", min: 0 },
          { key: "defaultDeliveryFee", label: "Frais de livraison de base (FCFA)", type: "number", min: 0, help: "Tarif fixe, ou frais de départ en mode « Distance »." },
          { key: "docExpiryDays", label: "Rappel avant expiration des documents (jours)", type: "number", min: 1 },
        ] },
        { title: "Livraison selon la distance", description: "Frais = base + prix du km au-delà des km inclus, arrondi à 50 F. Tant que le mode « Distance » n'est pas activé et la position de la boutique renseignée, le tarif fixe s'applique.", fields: [
          { key: "deliveryMode", label: "Mode de calcul", type: "select", options: [{ value: "Fixed", label: "Tarif fixe" }, { value: "Distance", label: "Selon la distance" }] },
          { key: "deliveryStoreLat", label: "Latitude de la boutique", type: "number", step: "0.00001", help: "Exemple Dakar-Plateau : 14.6928. Clic droit sur la carte Google Maps → copier les coordonnées." },
          { key: "deliveryStoreLng", label: "Longitude de la boutique", type: "number", step: "0.00001", help: "Exemple Dakar-Plateau : -17.4467" },
          { key: "deliveryBaseKm", label: "Kilomètres inclus dans le frais de base", type: "number", step: "0.5", min: 0 },
          { key: "deliveryPerKm", label: "Prix de chaque km supplémentaire (FCFA)", type: "number", min: 0 },
          { key: "deliveryMaxFee", label: "Frais maximum (FCFA, 0 = sans plafond)", type: "number", min: 0 },
          { key: "deliveryMaxKm", label: "Distance maximale livrable (km)", type: "number", min: 1 },
          { key: "deliveryRoadFactor", label: "Coefficient routier", type: "number", step: "0.05", min: 1, help: "Distance à vol d'oiseau × ce coefficient (1,3 = les routes allongent le trajet d'environ 30 %)." },
          { key: "deliveryFreeAbove", label: "Livraison offerte dès (FCFA d'articles, 0 = jamais)", type: "number", min: 0 },
        ] },
        { title: "Promotions", description: "Désactivées : le champ « code promo » disparaît du panier et le serveur refuse tout code. Réactivables à tout moment.", fields: [
          { key: "promotionsEnabled", label: "Codes promo activés", type: "checkbox" },
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
