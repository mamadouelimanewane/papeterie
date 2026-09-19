"use client"

import { useState } from "react"
import { fmt, type CartItem } from "./useCart"

type Props = {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  count: number
  total: number
  dec: (id: string) => void
  inc: (id: string) => void
  clear: () => void
}

export default function CartDrawer({ open, onClose, cart, count, total, dec, inc, clear }: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [method, setMethod] = useState("Cash")
  const [result, setResult] = useState<any>(null)
  const [placing, setPlacing] = useState(false)

  async function placeOrder() {
    if (cart.length === 0) return
    setPlacing(true); setResult(null)
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
      setResult(await res.json()); clear()
    } catch (e: any) { setResult({ error: e?.message ?? "Erreur" }) } finally { setPlacing(false) }
  }
  const link = result?.paymentData?.data?.data?.link ?? result?.paymentData?.data?.link

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-bold">Mon panier ({count})</h3>
          <button onClick={onClose} className="text-slate-400">X</button>
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
            <div className="flex items-center justify-between py-1 text-sm text-slate-500"><span>Livraison</span><span>500 F</span></div>
            <div className="flex items-center justify-between text-lg font-extrabold"><span>Total</span><span className="text-indigo-700">{fmt(total + 500)}</span></div>
            <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {placing ? "Envoi..." : "Valider la commande"}
            </button>
          </div>
        )}
      </aside>

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
            <button onClick={() => { setResult(null); onClose() }} className="mt-4 block w-full text-sm text-slate-400">Fermer</button>
          </div>
        </div>
      )}
    </>
  )
}
