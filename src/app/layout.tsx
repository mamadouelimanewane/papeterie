import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import OneSignalProvider from "@/components/providers/OneSignalProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NDUGUMi Admin",
  description: "Plateforme de gestion NDUGUMi — Admin Backoffice",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  )
}
