"use client"

import { useEffect, useState } from "react"

type Product = { id: string; name: string; price: number; image?: string | null; category?: string | null }
type Store = { id: string; name: string; address?: string | null; phone?: string | null; products?: Product[] }
type CartItem = Product & { qty: number }

export default function ShopPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [method, setMethod] = useState("Cash")
  const [result, setResult] = useState<any>(null)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    fetch("/api/store?products=1")
      .then((r) => r.json())
      .then((d) => setStore(d))
      .catch(() => setStore(null))
      .finally(() => setLoading(false))
  }, [])

  const add = (p: Product) =>
    setCart((c) => {
      const f = c.find((x) => x.id === p.id)
      return f ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { ...p, qty: 1 }]
    })
  const dec = (id: string) =>
    setCart((c) => c.flatMap((x) => (x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])))

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0)

  async function placeOrder() {
    if (cart.length === 0) return
    setPlacing(true)
    setResult(null)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          subtotal: total,
          deliveryFee: 500,
          paymentMethod: method,
          items: cart.map((x) => ({ name: x.name, price: x.price, qty: x.qty })),
          address,
          firstName: name || "Client",
          phone_number: phone,
          notes: "Commande test (web /shop)",
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

  if (loading) return <main className="p-6 text-center">Chargement…</main>
  if (!store) return <main className="p-6 text-center text-red-600">Aucune boutique active configurée.</main>

  return (
    <main className="mx-auto max-w-3xl p-4 pb-40">
      <header className="mb-4 rounded-xl bg-indigo-600 p-5 text-white">
        <h1 className="text-xl font-bold">{store.name}</h1>
        <p className="text-sm opacity-90">{store.address} · {store.phone}</p>
        <p className="mt-1 text-xs opacity-75">Interface client de test — parcours commande sans app mobile</p>
      </header>

      <h2 className="mb-2 font-semibold">Catalogue ({store.products?.length ?? 0})</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(store.products ?? []).map((p) => (
          <div key={p.id} className="rounded-lg border p-3">
            {p.image && <img src={p.image} alt={p.name} className="mb-2 h-24 w-full rounded object-cover" />}
            <div className="text-sm font-medium leading-tight">{p.name}</div>
            <div className="text-xs text-gray-500">{p.category}</div>
            <div className="mt-1 font-bold text-indigo-600">{p.price} F</div>
            <button onClick={() => add(p)} className="mt-2 w-full rounded bg-indigo-600 py-1 text-sm text-white">
              Ajouter
            </button>
          </div>
        ))}
        {(store.products ?? []).length === 0 && <p className="text-sm text-gray-500">Aucun produit.</p>}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 max-h-28 overflow-auto text-sm">
              {cart.map((x) => (
                <div key={x.id} className="flex items-center justify-between py-0.5">
                  <span>{x.name}</span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => dec(x.id)} className="rounded bg-gray-200 px-2">−</button>
                    {x.qty}
                    <button onClick={() => add(x)} className="rounded bg-gray-200 px-2">+</button>
                    <b className="w-16 text-right">{x.price * x.qty} F</b>
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="rounded border px-2 py-1 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="rounded border px-2 py-1 text-sm" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de livraison" className="col-span-2 rounded border px-2 py-1 text-sm" />
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded border px-2 py-1 text-sm">
                <option>Cash</option>
                <option>Wave</option>
                <option>Orange Money</option>
                <option>Versus</option>
              </select>
              <button onClick={placeOrder} disabled={placing} className="rounded bg-emerald-600 py-1 font-semibold text-white disabled:opacity-50">
                {placing ? "…" : `Commander · ${total} F`}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4 text-sm">
          {result.error ? (
            <p className="text-red-600">Erreur : {result.error}</p>
          ) : (
            <>
              <p className="font-semibold text-emerald-700">✅ Commande créée : {result.orderId}</p>
              <p>Paiement : {result.paymentInitiated ? "initié" : "non initié"} {result.paymentError ? `(${result.paymentError})` : ""}</p>
              {link && (
                <a href={link} target="_blank" className="mt-1 inline-block rounded bg-indigo-600 px-3 py-1 text-white">
                  Payer maintenant →
                </a>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}
