"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { fmt } from "./useCart"
import { useMyOrders, payOrder } from "./useMyOrders"

type Status = { orderId: string; status: string; paymentStatus: string; paymentMethod: string; total: number; paid: boolean }

const ORDER_LABEL: Record<string, string> = {
  Pending: "En attente", Processing: "En préparation", OnTheWay: "En route", Delivering: "En livraison",
  Delivered: "Livrée", Completed: "Livrée", Cancelled: "Annulée",
}

/** Bouton « Mes commandes » + panneau : suivi et paiement des commandes passées depuis ce navigateur. */
export default function MyOrders() {
  const orders = useMyOrders()
  const [open, setOpen] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [paying, setPaying] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    Promise.all(orders.map((o) =>
      fetch(`/api/shop/order-status?orderId=${encodeURIComponent(o.orderId)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    )).then((list) => {
      if (!alive) return
      setStatuses(Object.fromEntries(list.filter(Boolean).map((s: Status) => [s.orderId, s])))
    })
    return () => { alive = false }
  }, [open, orders])

  if (!orders.length) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
        {"📦"} Mes commandes
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
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => {
                const s = statuses[o.orderId]
                const canPay = s && !s.paid && s.status !== "Cancelled"
                return (
                  <li key={o.orderId} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs text-slate-500">N° {o.orderId}</div>
                        <div className="font-bold text-indigo-700">{fmt(s?.total ?? o.total)}</div>
                        <div className="text-[11px] text-slate-400">{new Date(o.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                      </div>
                      <div className="text-right text-xs">
                        {!s ? <span className="text-slate-400">…</span> : (
                          <>
                            <div className="font-semibold text-slate-700">{ORDER_LABEL[s.status] ?? s.status}</div>
                            <div className={s.paid ? "font-semibold text-emerald-600" : "text-amber-600"}>{s.paid ? "Payée ✓" : "Non payée"}</div>
                          </>
                        )}
                      </div>
                    </div>
                    {canPay && (
                      <button disabled={paying === o.orderId}
                        onClick={async () => { setMsg(null); setPaying(o.orderId); const e = await payOrder(o.orderId); setPaying(null); if (e) setMsg(e) }}
                        className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                        {paying === o.orderId ? "Ouverture du paiement…" : "Payer en ligne (Wave, Orange Money, carte)"}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">Commandes passées depuis ce navigateur. Paiement à la livraison toujours possible.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
