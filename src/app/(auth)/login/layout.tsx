import type { Metadata, Viewport } from "next"
import PwaRegister from "@/components/pwa/PwaRegister"

// La page de connexion est l'entrée de l'administration : on peut y installer l'application « Admin ».
export const metadata: Metadata = {
  title: "Schoolmatik Admin — Connexion",
  manifest: "/pwa/admin.webmanifest",
  icons: { icon: "/pwa/admin-192.png", apple: "/pwa/admin-180.png" },
  appleWebApp: { capable: true, title: "Admin", statusBarStyle: "black-translucent" },
}
export const viewport: Viewport = { themeColor: "#111827" }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<PwaRegister app="admin" label="Schoolmatik Admin" /></>
}
