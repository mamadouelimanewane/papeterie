"use client"

import { useEffect, useState } from "react"

/** Commandes passées depuis ce navigateur (pour les suivre et relancer le paiement). */
export type MyOrder = { orderId: string; total: number; method: string; date: string }
const KEY = "schoolmatik_orders"
const EVT = "schoolmatik-orders"

function read(): MyOrder[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as MyOrder[] } catch { return [] }
}

export function rememberOrder(o: MyOrder) {
  try {
    const list = [o, ...read().filter((x) => x.orderId !== o.orderId)].slice(0, 20)
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new Event(EVT))
  } catch { /* stockage indisponible */ }
}

export function useMyOrders() {
  const [orders, setOrders] = useState<MyOrder[]>([])
  useEffect(() => {
    const load = () => setOrders(read())
    load()
    window.addEventListener(EVT, load)
    return () => window.removeEventListener(EVT, load)
  }, [])
  return orders
}

/** Ouvre la page de paiement Versus d'une commande (Wave, Orange Money, carte). Renvoie un message d'erreur éventuel. */
export async function payOrder(orderId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/shop/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok || !d.link) return d.error ?? "Paiement momentanément indisponible"
    window.location.href = d.link
    return null
  } catch {
    return "Erreur réseau, réessayez"
  }
}
