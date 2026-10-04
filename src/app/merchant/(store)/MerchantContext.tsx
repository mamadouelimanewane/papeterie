"use client"

import { createContext, useContext } from "react"

export interface MerchantStore {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  image: string | null
  rating: number
  walletMoney: number
  status: string
  serviceArea: string | null
  segment: string
  createdAt: string
  lastLoginAt: string | null
  _count: { orders: number; products: number }
}

export const MerchantContext = createContext<{
  store: MerchantStore
  setStore: (s: MerchantStore) => void
} | null>(null)

/** Boutique de la session marchand (fournie par le layout après vérification serveur). */
export function useMerchant() {
  const ctx = useContext(MerchantContext)
  if (!ctx) throw new Error("useMerchant doit être utilisé dans l'espace marchand")
  return ctx
}

/** Appel JSON vers /api/merchant/* ; session expirée → retour à la page de connexion. */
export async function merchantFetch<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  let data: unknown = null
  try { data = await res.json() } catch { /* réponse vide */ }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/merchant/login"
  }
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || `Erreur ${res.status}`)
  return data as T
}

export const fmtFcfa = (n: unknown) => `${Math.round(Number(n ?? 0)).toLocaleString("fr-FR")} FCFA`
export const fmtWhen = (d: unknown) =>
  d ? new Date(String(d)).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  Pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  Accepted: { label: "Livreur assigné", cls: "bg-blue-100 text-blue-700" },
  Processing: { label: "En livraison", cls: "bg-cyan-100 text-cyan-700" },
  Delivered: { label: "Livrée", cls: "bg-green-100 text-green-700" },
  Completed: { label: "Terminée", cls: "bg-green-100 text-green-700" },
  Cancelled: { label: "Annulée", cls: "bg-red-100 text-red-600" },
  Annule: { label: "Annulée", cls: "bg-red-100 text-red-600" },
}
export const statusOf = (s: string) => ORDER_STATUS[s] ?? { label: s, cls: "bg-gray-100 text-gray-600" }

export type OrderItem = { productId?: string; name?: string; price?: number; quantity?: number }
export const itemsOf = (items: unknown) => (Array.isArray(items) ? (items as OrderItem[]) : [])
export const itemsSummary = (items: unknown) =>
  itemsOf(items).map((i) => `${i.name ?? "Article"} x${i.quantity ?? 1}`).join(", ") || "—"
/** Nom du client : les commandes invité le stockent dans les notes (« Client: X | Tél: Y | … »). */
export const customerOf = (notes: string | null) => notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim() ?? "Client"
export const phoneOf = (notes: string | null) => notes?.match(/Tél:\s*([^|]+)/)?.[1]?.trim() ?? null
