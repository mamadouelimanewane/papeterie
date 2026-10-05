import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Installer les applications — Schoolmatik",
  description: "Installez Schoolmatik (client, livreur, admin) sur l'écran d'accueil de votre téléphone.",
}

export default function InstallerLayout({ children }: { children: React.ReactNode }) {
  return children
}
