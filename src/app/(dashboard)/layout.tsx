import type { Metadata, Viewport } from "next"
import PwaRegister from "@/components/pwa/PwaRegister"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import RouteGuard from "@/components/layout/RouteGuard"
import { SidebarProvider } from "@/context/SidebarContext"
import SessionProvider from "@/components/layout/SessionProvider"
import { FeedbackProvider } from "@/components/admin/Feedback"
import { I18nProvider } from "@/i18n/I18nProvider"

// Application installable « Admin » (raccourci sur l'écran d'accueil)
export const metadata: Metadata = {
  manifest: "/pwa/admin.webmanifest",
  icons: { icon: "/pwa/admin-192.png", apple: "/pwa/admin-180.png" },
  appleWebApp: { capable: true, title: "Admin", statusBarStyle: "black-translucent" },
}
export const viewport: Viewport = { themeColor: "#111827" }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider><I18nProvider><SidebarProvider><FeedbackProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-auto"><RouteGuard>{children}</RouteGuard></main>
        </div>
      </div>
      <PwaRegister app="admin" label="Schoolmatik Admin" />
    </FeedbackProvider></SidebarProvider></I18nProvider></SessionProvider>
  )
}
