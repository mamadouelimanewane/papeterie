"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useCart, fmt } from "../useCart"
import CartDrawer from "../CartDrawer"

type KitItem = { name: string; price: number; qty: number }
type Kit = { id: string; name: string; level: string; series?: string | null; cycle: string; description?: string | null; image?: string | null; price: number; discountPct?: number; items: KitItem[] }
const CYCLES = ["Primaire", "College", "Lycee"]
const CYCLE_LABEL: Record<string, string> = { Primaire: "Primaire", College: "Collège", Lycee: "Lycée" }

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null)
  const [config, setConfig] = useState<{ included: boolean; qty: number }[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const { cart, add, dec, inc, clear, count, total } = useCart()

  useEffect(() => {
    fetch("/api/kits").then((r) => r.json()).then((d) => setKits(Array.isArray(d) ? d : [])).catch(() => setKits([])).finally(() => setLoading(false))
  }, [])

  const clsOf = (k: Kit) => (k.series ? `${k.level} ${k.series}` : k.level)

  const openKit = (k: Kit) => {
    setSelectedKit(k)
    setConfig(k.items.map((it) => ({ included: true, qty: it.qty })))
  }
  const toggle = (i: number) => setConfig((c) => c.map((x, j) => (j === i ? { ...x, included: !x.included } : x)))
  const setQty = (i: number, d: number) => setConfig((c) => c.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty + d) } : x)))

  const chosen = selectedKit
    ? selectedKit.items.map((it, i) => ({ ...it, included: config[i]?.included ?? true, qty: config[i]?.qty ?? it.qty }))
    : []
  const itemsSubtotal = chosen.filter((x) => x.included).reduce((s, x) => s + x.price * x.qty, 0)
  const kitPct = selectedKit?.discountPct ?? 0
  const kitDiscount = Math.round((itemsSubtotal * kitPct) / 100)
  const kitTotal = itemsSubtotal - kitDiscount
  const chosenCount = chosen.filter((x) => x.included).length

  const packPrice = (k: Kit) => Math.round(k.price * (1 - (k.discountPct ?? 0) / 100))

  const addKitConfigured = () => {
    if (!selectedKit) return
    const components = chosen.filter((x) => x.included).map((x) => ({ name: x.name, price: x.price, qty: x.qty }))
    if (components.length === 0) return
    const full = components.length === selectedKit.items.length && chosen.every((x, i) => x.qty === selectedKit.items[i].qty)
    add({
      id: `${selectedKit.id}:${Date.now()}`,
      name: `Kit ${clsOf(selectedKit)}${full ? "" : " (personnalise)"}`,
      price: kitTotal,
      image: selectedKit.image,
      components,
    })
    setSelectedKit(null)
    setCartOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/shop" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Retour">&larr;</Link>
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight text-indigo-700">Kits scolaires par classe</div>
            <div className="text-[11px] text-slate-400">De la CI à la Terminale (L, S1, S2)</div>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative ml-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100">
            {"🛒"}
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">{count}</span>}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">Rentrée facile</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{"🎒"} Kits complets par classe</h1>
          <p className="mt-1 max-w-xl text-sm text-amber-50">Choisissez la classe de votre enfant : toutes les fournitures et livres recommandés, réunis en un pack prêt à commander.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                <div className="space-y-2 p-3"><div className="h-3 w-20 animate-pulse rounded bg-slate-200" /><div className="h-4 w-16 animate-pulse rounded bg-slate-200" /></div>
              </div>
            ))}
          </div>
        )}
        {!loading && kits.length === 0 && <p className="py-10 text-center text-slate-400">Aucun kit disponible.</p>}

        {CYCLES.map((cy) => {
          const list = kits.filter((k) => k.cycle === cy)
          if (!list.length) return null
          return (
            <section key={cy} className="mb-8">
              <h2 className="mb-3 text-lg font-extrabold">{CYCLE_LABEL[cy]}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((k) => (
                  <button key={k.id} onClick={() => openKit(k)}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-slate-100 transition hover:shadow-lg">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      {k.image && <img src={k.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />}
                      <span className="absolute left-2 top-2 rounded-lg bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{clsOf(k)}</span>
                      {(k.discountPct ?? 0) > 0 && <span className="absolute right-2 top-2 rounded-lg bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">-{k.discountPct}%</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="text-sm font-semibold">Kit {clsOf(k)}</div>
                      <div className="text-xs text-slate-400">{k.items.length} articles</div>
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <div className="leading-tight">
                          {(k.discountPct ?? 0) > 0 && <div className="text-[11px] text-slate-400 line-through">{fmt(k.price)}</div>}
                          <div className="font-extrabold text-indigo-700">{fmt(packPrice(k))}</div>
                        </div>
                        <span className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-indigo-700">Personnaliser</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* Kit detail modal */}
      {selectedKit && (
        <div className="fixed inset-0 z-[55] grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4" onClick={() => setSelectedKit(null)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-32 w-full bg-slate-100">
              {selectedKit.image && <img src={selectedKit.image} alt="" className="h-full w-full object-cover" />}
              <button onClick={() => setSelectedKit(null)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-600">X</button>
              <span className="absolute bottom-3 left-3 rounded-lg bg-indigo-600 px-3 py-1 text-sm font-bold text-white">Kit {clsOf(selectedKit)}</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500">{selectedKit.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Composition personnalisable</span>
                <span className="text-xs text-slate-400">{chosenCount}/{selectedKit.items.length} articles</span>
              </div>
              <p className="mb-1 text-[11px] text-slate-400">Décochez ce que vous avez déjà, ajustez les quantités.</p>
              <ul className="divide-y">
                {chosen.map((it, i) => (
                  <li key={i} className={`flex items-center gap-3 py-2 ${it.included ? "" : "opacity-40"}`}>
                    <input type="checkbox" checked={it.included} onChange={() => toggle(i)} className="h-4 w-4 shrink-0 accent-indigo-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium leading-tight">{it.name}</div>
                      <div className="text-xs text-slate-400">{fmt(it.price)} / unité</div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm">
                      <button disabled={!it.included} onClick={() => setQty(i, -1)} className="text-slate-500 disabled:opacity-30">-</button>
                      <span className="min-w-4 text-center">{it.qty}</span>
                      <button disabled={!it.included} onClick={() => setQty(i, 1)} className="text-slate-500 disabled:opacity-30">+</button>
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm font-semibold">{it.included ? fmt(it.price * it.qty) : "-"}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 rounded-xl bg-indigo-50 px-4 py-3">
                {kitDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm text-slate-500"><span>Sous-total articles</span><span>{fmt(itemsSubtotal)}</span></div>
                    <div className="flex items-center justify-between text-sm font-medium text-amber-600"><span>Remise pack -{kitPct}%</span><span>-{fmt(kitDiscount)}</span></div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Total du kit</span>
                  <span className="text-xl font-extrabold text-indigo-700">{fmt(kitTotal)}</span>
                </div>
              </div>
              <button onClick={addKitConfigured} disabled={chosenCount === 0} className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                Ajouter au panier ({chosenCount} article{chosenCount > 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} count={count} total={total} dec={dec} inc={inc} clear={clear} />
    </div>
  )
}
