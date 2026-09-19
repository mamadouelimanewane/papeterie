"use client"

import { useEffect, useMemo, useState } from "react"

type Product = { id: string; name: string; price: number; image?: string | null; category?: string | null; description?: string | null }
type Store = { id: string; name: string; address?: string | null; phone?: string | null; products?: Product[] }
type CartItem = Product & { qty: number }

const CAT_EMOJI: Record<string, string> = {
  Livres: "📚", Cahiers: "📓", Fournitures: "✏️", Geometrie: "📐", "Art & Creativite": "🎨",
}

export default function ShopPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string>("Tout")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [method, setMethod] = useState("Cash")
  const [result, setResult] = useState<any>(null)
  const [placing, setPlacing] = useState(false)

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

  const add = (p: Product) => {
    setCart((c) => {
      const f = c.find((x) => x.id === p.id)
      return f ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { ...p, qty: 1 }]
    })
    setCartOpen(true)
  }
  const dec = (id: string) => setCart((c) => c.flatMap((x) => (x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])))
  const inc = (id: string) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)))
  const count = cart.reduce((s, x) => s + x.qty, 0)
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const fmt = (n: number) => n.toLocaleString("fr-FR") + " F"

  async function placeOrder() {
    if (cart.length === 0) return
    setPlacing(true)
    setResult(null)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total, subtotal: total, deliveryFee: 500, paymentMethod: method,
          items: cart.map((x) => ({ name: x.name, price: x.price, qty: x.qty })),
          address, firstName: name || "Client", phone_number: phone, notes: "Commande web (/shop)",
        }),
      })
      setResult(await res.json())
      setCart([])
    } catch (e: any) {
      setResult({ error: e?.message ?? "Erreur" })
    } finally {
      setPlacing(false)
    }
  }
  const link = result?.paymentData?.data?.data?.link ?? result?.paymentData?.data?.link

  if (loading) return <main className="grid min-h-screen place-items-center text-slate-500">Chargement de la boutique...</main>
  if (!store) return <main className="grid min-h-screen place-items-center text-red-600">Aucune boutique active.</main>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg">{"📚"}</span>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Rentree scolaire</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Tous les livres &amp; fournitures, livres a Dakar</h1>
          <p className="mt-1 max-w-xl text-sm text-indigo-100">Cahiers, manuels, kits de geometrie, sacs... Commandez en ligne et payez par Wave, Orange Money ou a la livraison.</p>
        </div>
      </section>

      {/* Categories */}
      <div className="mx-auto max-w-6xl px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCat === c ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}>
              {c === "Tout" ? "🛍️ Tout" : `${CAT_EMOJI[c] ?? "•"} ${c}`}
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
                  : <div className="grid h-full place-items-center text-4xl">{CAT_EMOJI[p.category ?? ""] ?? "📦"}</div>}
                {p.category && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{p.category}</span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="line-clamp-2 text-sm font-medium leading-tight">{p.name}</div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-extrabold text-indigo-700">{fmt(p.price)}</span>
                  <button onClick={() => add(p)} className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700" aria-label="Ajouter">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-10 text-center text-slate-400">Aucun article trouve.</p>}
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
        {store.name} - {store.address} - {store.phone}
      </footer>

      {/* Cart overlay */}
      {cartOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setCartOpen(false)} />}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-bold">Mon panier ({count})</h3>
          <button onClick={() => setCartOpen(false)} className="text-slate-400">X</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 && <p className="mt-10 text-center text-slate-400">Votre panier est vide.</p>}
          {cart.map((x) => (
            <div key={x.id} className="mb-3 flex gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                {x.image ? <img src={x.image} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full place-items-center">{"📦"}</div>}
              </div>
              <div className="flex-1">
                <div className="line-clamp-1 text-sm font-medium">{x.name}</div>
                <div className="text-xs text-indigo-700">{fmt(x.price)}</div>
                <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm">
                  <button onClick={() => dec(x.id)} className="text-slate-500">-</button>
                  <span className="min-w-4 text-center">{x.qty}</span>
                  <button onClick={() => inc(x.id)} className="text-slate-500">+</button>
                </div>
              </div>
              <div className="text-sm font-semibold">{fmt(x.price * x.qty)}</div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="space-y-2 border-t p-4">
            <div className="grid grid-cols-2 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="rounded-lg border px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telephone" className="rounded-lg border px-3 py-2 text-sm" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de livraison" className="col-span-2 rounded-lg border px-3 py-2 text-sm" />
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="col-span-2 rounded-lg border px-3 py-2 text-sm">
                <option>Cash</option><option>Wave</option><option>Orange Money</option><option>Versus</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-1 text-sm text-slate-500">
              <span>Livraison</span><span>500 F</span>
            </div>
            <div className="flex items-center justify-between text-lg font-extrabold">
              <span>Total</span><span className="text-indigo-700">{fmt(total + 500)}</span>
            </div>
            <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {placing ? "Envoi..." : "Valider la commande"}
            </button>
          </div>
        )}
      </aside>

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={() => setResult(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            {result.error ? (
              <><div className="text-4xl">{"⚠️"}</div><p className="mt-2 font-semibold text-red-600">Erreur</p><p className="text-sm text-slate-500">{result.error}</p></>
            ) : (
              <>
                <div className="text-4xl">{"✅"}</div>
                <p className="mt-2 font-bold text-emerald-700">Commande confirmee !</p>
                <p className="text-sm text-slate-500">N {result.orderId}</p>
                {result.paymentError && <p className="mt-1 text-xs text-amber-600">Paiement : {result.paymentError}</p>}
                {link && <a href={link} target="_blank" className="mt-3 inline-block rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white">Payer maintenant</a>}
              </>
            )}
            <button onClick={() => { setResult(null); setCartOpen(false) }} className="mt-4 block w-full text-sm text-slate-400">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
