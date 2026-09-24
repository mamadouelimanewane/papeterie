"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { fmt } from "./useCart"
import { useMyOrders, payOrder } from "./useMyOrders"

type Status = { orderId: string; status: string; paymentStatus: string; paymentMethod: string; total: number; createdAt: string; paid: boolean }

const ORDER_LABEL: Record<string, string> = {
  Pending: "En attente", Accepted: "Acceptée par un livreur", Processing: "En préparation", PickedUp: "Récupérée",
  OnTheWay: "En route", Delivering: "En livraison", Delivered: "Livrée", Completed: "Livrée", Cancelled: "Annulée",
}
/** Déverrouillage valable jusqu'à la fermeture de l'onglet / de l'application (sessionStorage). */
const UNLOCK_KEY = "schoolmatik_orders_phone"
const readUnlock = () => { try { return sessionStorage.getItem(UNLOCK_KEY) } catch { return null } }

/**
 * Bouton « Mes commandes » + panneau.
 * Les numéros de commande sont gardés sur l'appareil, mais leur contenu n'est affiché qu'après
 * confirmation du numéro de téléphone utilisé à la commande (vérifié par le serveur).
 * Fermer puis rouvrir l'application reverrouille la liste : un tiers qui prend le téléphone ne voit rien.
 */
export default function MyOrders() {
  const orders = useMyOrders()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [list, setList] = useState<Status[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async (p: string) => {
    setLoading(true); setMsg(null)
    try {
      const res = await fetch("/api/shop/my-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, orderIds: orders.map((o) => o.orderId) }),
      })
      const d = await res.json()
      if (!res.ok) { setMsg(d.error ?? "Vérification impossible"); return }
      setList(d.orders)
      try { sessionStorage.setItem(UNLOCK_KEY, p) } catch { /* stockage indisponible */ }
    } catch { setMsg("Erreur réseau, réessayez") } finally { setLoading(false) }
  }

  const openPanel = () => {
    setOpen(true); setList(null); setMsg(null)
    const p = readUnlock()
    if (p) load(p)
  }
  const lock = () => {
    try { sessionStorage.removeItem(UNLOCK_KEY) } catch { /* stockage indisponible */ }
    setList(null); setPhone(""); setOpen(false)
  }

  if (!orders.length) return null

  return (
    <>
      <button onClick={openPanel} aria-label="Mes commandes" title="Mes commandes"
        className="grid h-10 shrink-0 place-items-center whitespace-nowrap rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200">
        {/* Icône seule sur téléphone */}
        <span>{"📦"}<span className="hidden sm:inline"> Mes commandes</span></span>
      </button>
      {/* Rendu dans <body> : l'en-tête (backdrop-blur) piégerait un élément « fixed » */}
      {open && createPortal(
        <div className="fixed inset-0 z-[65] grid place-items-end bg-black/40 sm:place-items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">Mes commandes</h3>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="Fermer">✕</button>
            </div>
            {msg && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>}

            {list === null ? (
              <form onSubmit={(e) => { e.preventDefault(); load(phone) }} className="space-y-3">
                <p className="text-sm text-slate-600">{"🔒"} Pour protéger vos commandes, confirmez le numéro de téléphone utilisé lors de la commande.</p>
                <div className="flex rounded-lg border border-slate-200 focus-within:border-indigo-400">
                  <span className="grid place-items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">+221</span>
                  <input required type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 123 45 67" className="w-full rounded-r-lg px-3 py-2.5 text-sm outline-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? "Vérification…" : "Voir mes commandes"}
                </button>
              </form>
            ) : (
              <>
                {list.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">Aucune commande passée avec ce numéro sur cet appareil.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {list.map((s) => {
                      const canPay = !s.paid && s.status !== "Cancelled"
                      return (
                        <li key={s.orderId} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-mono text-xs text-slate-500">N° {s.orderId}</div>
                              <div className="font-bold text-indigo-700">{fmt(s.total)}</div>
                              <div className="text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-semibold text-slate-700">{ORDER_LABEL[s.status] ?? s.status}</div>
                              <div className={s.paid ? "font-semibold text-emerald-600" : "text-amber-600"}>{s.paid ? "Payée ✓" : "Non payée"}</div>
                            </div>
                          </div>
                          {canPay && (
                            <button disabled={paying === s.orderId}
                              onClick={async () => { setMsg(null); setPaying(s.orderId); const e = await payOrder(s.orderId); setPaying(null); if (e) setMsg(e) }}
                              className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                              {paying === s.orderId ? "Ouverture du paiement…" : "Payer en ligne (Wave, Orange Money, carte)"}
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                <button onClick={lock} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">{"🔒"} Verrouiller</button>
              </>
            )}
            <p className="mt-3 text-[11px] text-slate-400">La liste se reverrouille à la fermeture de l&apos;application. Paiement à la livraison toujours possible.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
