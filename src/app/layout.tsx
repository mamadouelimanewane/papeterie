import type { Metadata } from "next"
import "./globals.css"
import OneSignalProvider from "@/components/providers/OneSignalProvider"

export const metadata: Metadata = {
  title: "Papeterie Admin",
  description: "Plateforme Papeterie — Backoffice Administration",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  )
}
