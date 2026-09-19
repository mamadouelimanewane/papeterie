import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import RouteGuard from "@/components/layout/RouteGuard"
import { SidebarProvider } from "@/context/SidebarContext"
import SessionProvider from "@/components/layout/SessionProvider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider><SidebarProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-auto"><RouteGuard>{children}</RouteGuard></main>
        </div>
      </div>
    </SidebarProvider></SessionProvider>
  )
}
