import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schoolmatik Librairie — Fournitures & livres scolaires",
  description: "Commandez vos fournitures et livres scolaires à Dakar, livrés à domicile. Kits complets par classe, de la CI à la Terminale.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
