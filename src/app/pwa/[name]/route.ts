import { NextResponse } from "next/server"

/**
 * Manifestes des trois applications installables : /pwa/client.webmanifest, /pwa/livreur.webmanifest,
 * /pwa/admin.webmanifest. Chaque application a son nom, son icône, sa couleur, son adresse de départ et sa portée :
 * installées toutes les trois sur le même téléphone, elles apparaissent comme trois applications distinctes.
 */
type AppDef = {
  id: string
  name: string
  short: string
  description: string
  start: string
  scope: string
  theme: string
  background: string
  shortcuts: { name: string; url: string }[]
}

const APPS: Record<string, AppDef> = {
  client: {
    id: "/shop", name: "Schoolmatik — Librairie", short: "Schoolmatik",
    description: "Livres et fournitures scolaires livrés à Dakar : kits par classe, paiement Wave, Orange Money ou à la livraison.",
    start: "/shop?source=pwa", scope: "/shop", theme: "#4F46E5", background: "#F8FAFC",
    shortcuts: [{ name: "Kits par classe", url: "/shop/kits?source=pwa" }],
  },
  livreur: {
    id: "/livreur", name: "Schoolmatik Livreur", short: "Livreur",
    description: "Espace livreur : commandes disponibles, livraison en cours, navigation et gains.",
    start: "/livreur?source=pwa", scope: "/livreur", theme: "#059669", background: "#F8FAFC",
    shortcuts: [],
  },
  admin: {
    id: "/dashboard", name: "Schoolmatik Admin", short: "Admin",
    description: "Back-office de la librairie : commandes, produits, livreurs, finances et réglages.",
    start: "/dashboard?source=pwa", scope: "/", theme: "#111827", background: "#F9FAFB",
    shortcuts: [
      { name: "Commandes", url: "/orders?source=pwa" },
      { name: "Produits", url: "/products?source=pwa" },
    ],
  },
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const key = name.replace(/\.webmanifest$/, "")
  const app = APPS[key]
  if (!app || !name.endsWith(".webmanifest")) return new NextResponse("Not found", { status: 404 })

  const manifest = {
    id: app.id,
    name: app.name,
    short_name: app.short,
    description: app.description,
    lang: "fr",
    dir: "ltr",
    start_url: app.start,
    scope: app.scope,
    display: "standalone",
    orientation: "portrait",
    background_color: app.background,
    theme_color: app.theme,
    categories: ["shopping", "business"],
    icons: [
      { src: `/pwa/${key}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/pwa/${key}-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/pwa/${key}-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: app.shortcuts.map((s) => ({ name: s.name, url: s.url, icons: [{ src: `/pwa/${key}-192.png`, sizes: "192x192", type: "image/png" }] })),
  }
  return new NextResponse(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
