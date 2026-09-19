"use client"

import { useEffect, useState } from "react"

export type KitComponent = { name: string; price: number; qty: number }
export type CartItem = { id: string; name: string; price: number; image?: string | null; qty: number; components?: KitComponent[] }
const KEY = "schoolmatik_cart"

export const fmt = (n: number) => n.toLocaleString("fr-FR") + " F"

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setCart(JSON.parse(s))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(KEY, JSON.stringify(cart)) } catch {}
    }
  }, [cart, ready])

  const add = (p: { id: string; name: string; price: number; image?: string | null; components?: KitComponent[] }) =>
    setCart((c) => {
      const f = c.find((x) => x.id === p.id)
      return f
        ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
        : [...c, { id: p.id, name: p.name, price: p.price, image: p.image ?? null, qty: 1, components: p.components }]
    })
  const dec = (id: string) => setCart((c) => c.flatMap((x) => (x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])))
  const inc = (id: string) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)))
  const clear = () => setCart([])
  const count = cart.reduce((s, x) => s + x.qty, 0)
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0)

  return { cart, add, dec, inc, clear, count, total }
}
