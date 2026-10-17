import type { Metadata } from "next"

// Titre d'onglet de l'espace boutique (sinon celui du back-office : « Schoolmatik Admin »)
export const metadata: Metadata = {
  title: "Schoolmatik — Espace boutique",
  robots: { index: false, follow: false },
}

export default function MerchantRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
