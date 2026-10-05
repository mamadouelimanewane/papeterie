import type { Metadata, Viewport } from "next"
import PwaRegister from "@/components/pwa/PwaRegister"

export const metadata: Metadata = {
  title: "Schoolmatik Librairie — Fournitures & livres scolaires",
  description: "Commandez vos fournitures et livres scolaires à Dakar, livrés à domicile. Kits complets par classe, de la CI à la Terminale.",
  manifest: "/pwa/client.webmanifest",
  icons: { icon: "/pwa/client-192.png", apple: "/pwa/client-180.png" },
  appleWebApp: { capable: true, title: "Schoolmatik", statusBarStyle: "default" },
}
export const viewport: Viewport = { themeColor: "#4F46E5" }

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (<>{children}<PwaRegister app="client" label="Schoolmatik" /></>)
}
