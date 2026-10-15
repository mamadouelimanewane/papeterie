import type { Metadata } from "next"
import InstallLanding from "./InstallLanding"

export const metadata: Metadata = {
  title: "Installer Schoolmatik — Librairie scolaire",
  description: "Installez l'application Schoolmatik sur votre téléphone : livres et fournitures scolaires livrés à Dakar.",
}

/** /app (lien universel) et /i/<code> (lien personnel d'un client) arrivent ici. */
export default async function InstallerPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return <InstallLanding code={typeof code === "string" && /^[A-Za-z0-9_-]{16}$/.test(code) ? code : null} />
}
