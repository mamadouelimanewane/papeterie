import type { Metadata, Viewport } from "next"
import PwaRegister from "@/components/pwa/PwaRegister"

export const metadata: Metadata = {
  title: "Schoolmatik Livreur",
  description: "Espace livreur : commandes disponibles, livraison en cours, navigation et gains.",
  manifest: "/pwa/livreur.webmanifest",
  icons: { icon: "/pwa/livreur-192.png", apple: "/pwa/livreur-180.png" },
  appleWebApp: { capable: true, title: "Livreur", statusBarStyle: "default" },
}
export const viewport: Viewport = { themeColor: "#059669" }

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  return (<>{children}<PwaRegister app="livreur" label="Schoolmatik Livreur" /></>)
}
