"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useCart, fmt } from "./useCart"
import CartDrawer from "./CartDrawer"

type Product = { id: string; name: string; price: number; image?: string | null; category?: string | null }
type Store = { id: string; name: string; address?: string | null; phone?: string | null; products?: Product[] }

const CAT_EMOJI: Record<string, string> = {
  Livres: "📚", Cahiers: "📓", Fournitures: "✏️", Geometrie: "📐",
  "Art & Creativite": "🎨", Informatique: "💻", Sport: "⚽",
}

export default function ShopPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string>("Tout")
  const [cartOpen, setCartOpen] = useState(false)
  const { cart, add, dec, inc, clear, count, total } = useCart()

  useEffect(() => {
    fetch("/api/store?products=1").then((r) => r.json()).then(setStore).catch(() => setStore(null)).finally(() => setLoading(false))
  }, [])

  const products = store?.products ?? []
  const categories = useMemo(
    () => ["Tout", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))],
    [products]
  )
  const filtered = products.filter(
    (p) => (activeCat === "Tout" || p.category === activeCat) && p.name.toLowerCase().includes(query.toLowerCase())
  )

  const addProduct = (p: Product) => { add(p); setCartOpen(true) }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-1"><div className="h-3 w-40 animate-pulse rounded bg-slate-200" /><div className="h-2 w-28 animate-pulse rounded bg-slate-100" /></div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-5 flex gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                <div className="aspect-square animate-pulse bg-slate-200" />
                <div className="space-y-2 p-3"><div className="h-3 w-full animate-pulse rounded bg-slate-200" /><div className="h-4 w-16 animate-pulse rounded bg-slate-200" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (!store) return <main className="grid min-h-screen place-items-center text-red-600">Aucune boutique active.</main>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-black text-white shadow-sm">S</span>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight text-indigo-700">{store.name}</div>
              <div className="text-[11px] text-slate-400">Fournitures &amp; livres scolaires - Dakar</div>
            </div>
          </div>
          <div className="ml-auto hidden flex-1 sm:block">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un article..."
              className="w-full max-w-md rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-400" />
          </div>
          <button onClick={() => setCartOpen(true)} className="relative ml-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 sm:ml-0">
            {"🛒"}
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">{count}</span>}
          </button>
        </div>
        <div className="px-4 pb-3 sm:hidden">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none" />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Rentrée scolaire</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Tous les livres &amp; fournitures, livrés à Dakar</h1>
          <p className="mt-1 max-w-xl text-sm text-indigo-100">Cahiers, manuels, kits de géométrie, sacs… Commandez en ligne et payez par Wave, Orange Money ou à la livraison.</p>
          <Link href="/shop/kits" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-700">
            {"🎒"} Voir les kits par classe
          </Link>
        </div>
      </section>

      {/* Categories */}
      <div className="mx-auto max-w-6xl px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCat === c ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}>
              {c === "Tout" ? "🛍️ Tout" : `${CAT_EMOJI[c] ?? "🏷️"} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-4 py-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">{filtered.length} article{filtered.length > 1 ? "s" : ""}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:shadow-lg">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {p.image
                  ? <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  : <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-100 to-indigo-50 text-6xl transition group-hover:scale-105">{CAT_EMOJI[p.category ?? ""] ?? "📦"}</div>}
                {p.category && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{p.category}</span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="line-clamp-2 text-sm font-medium leading-tight">{p.name}</div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-extrabold text-indigo-700">{fmt(p.price)}</span>
                  <button onClick={() => addProduct(p)} className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700" aria-label="Ajouter">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-10 text-center text-slate-400">Aucun article trouvé.</p>}
      </main>

      {/* Banniere Kits par classe (bas de page) */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <Link href="/shop/kits" className="flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white transition hover:brightness-105">
          <span className="text-4xl">{"🎒"}</span>
          <div className="flex-1">
            <div className="text-lg font-extrabold">Kits scolaires par classe</div>
            <div className="text-sm text-amber-50">Toute la liste de fournitures, de la CI à la Terminale (L, S1, S2) — prête en 1 clic.</div>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600 sm:block">Voir les kits</span>
        </Link>
      </section>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
        {store.name} - {store.address} - {store.phone}
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} count={count} total={total} dec={dec} inc={inc} clear={clear} />
    </div>
  )
}
