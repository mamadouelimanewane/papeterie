"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { payOrder } from "../shop/useMyOrders"
import Receipt from "./Receipt"
import type { ReceiptData } from "@/lib/receipt"

type Status = { orderId: string; status: string; paymentStatus: string; total: number; paid: boolean }
const fmt = (n: number) => n.toLocaleString("fr-FR") + " F"

/**
 * Page de retour après le paiement Versus.
 * Le statut réel vient du webhook Versus (peut arriver quelques secondes après) : on interroge le serveur
 * plutôt que de croire l'URL de retour.
 */
export default function CheckoutResult({ mode }: { mode: "success" | "failure" }) {
  const params = useSearchParams()
  const orderId = params.get("orderId") ?? ""
  const token = params.get("t") ?? ""
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [s, setS] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tries, setTries] = useState(0)
  const [paying, setPaying] = useState(false)
  const [payMsg, setPayMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    let alive = true
    const load = () =>
      fetch(`/api/shop/order-status?orderId=${encodeURIComponent(orderId)}`)
        .then(async (r) => { const d = await r.json(); if (!alive) return; if (r.ok) setS(d); else setError(d.error ?? "Commande introuvable") })
        .catch(() => alive && setError("Erreur réseau"))
        .finally(() => alive && setTries((t) => t + 1))
    load()
    // Après un paiement : on attend la confirmation (webhook) jusqu'à ~1 minute
    const id = mode === "success" ? setInterval(load, 4000) : undefined
    return () => { alive = false; if (id) clearInterval(id) }
  }, [orderId, mode])

  const waiting = mode === "success" && !!s && !s.paid && tries < 15
  const paid = !!s?.paid

  // Paiement confirmé + lien signé : on charge le reçu détaillé
  useEffect(() => {
    if (!paid || !token || !orderId) return
    let alive = true
    fetch(`/api/shop/receipt?orderId=${encodeURIComponent(orderId)}&t=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setReceipt(d as ReceiptData) })
      .catch(() => {})
    return () => { alive = false }
  }, [paid, token, orderId])

  if (receipt) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 print:bg-white print:p-0">
        <style>{`@media print { @page { size: A4; margin: 14mm } html, body { background: #fff !important } }`}</style>
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex flex-col items-center gap-1 text-center print:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700" aria-hidden>✓</span>
            <h1 className="text-xl font-extrabold">Paiement reçu, merci !</h1>
            <p className="text-sm text-slate-500">Votre commande est confirmée. Le livreur vous contactera pour la remise.</p>
          </div>

          <Receipt r={receipt} />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
            <button onClick={() => window.print()}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">
              Imprimer ou enregistrer en PDF
            </button>
            <Link href="/shop" className="rounded-xl bg-white px-6 py-3 text-center text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-slate-50">
              Retour à la boutique
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400 print:hidden">Sur téléphone : « Imprimer », puis « Enregistrer au format PDF » pour garder le reçu.</p>
        </div>
      </main>
    )
  }

  const icon = paid ? "✅" : waiting ? "⏳" : "⚠️"
  const title = paid ? "Paiement reçu, merci !" : waiting ? "Paiement en cours de confirmation…" : mode === "success" ? "Paiement non encore confirmé" : "Le paiement n'a pas abouti"

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-800">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-black text-white">S</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Schoolmatik Librairie</p>

        {!orderId || error ? (
          <>
            <div className="mt-6 text-5xl">⚠️</div>
            <h1 className="mt-3 text-xl font-extrabold">{error ?? "Numéro de commande manquant"}</h1>
          </>
        ) : !s ? (
          <div className="mt-8 h-6 animate-pulse rounded bg-slate-100" />
        ) : (
          <>
            <div className="mt-6 text-5xl">{icon}</div>
            <h1 className="mt-3 text-xl font-extrabold">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">Commande N° <span className="font-mono">{s.orderId}</span></p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-700">{fmt(s.total)}</p>
            {paid && <p className="mt-3 text-sm text-slate-600">Votre commande est confirmée et sera préparée puis livrée. Vous serez contacté par le livreur.</p>}
            {waiting && <p className="mt-3 text-sm text-slate-500">Nous attendons la confirmation de l&apos;opérateur (Wave, Orange Money…). Cette page se met à jour automatiquement.</p>}
            {!paid && !waiting && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  {mode === "success"
                    ? "Si vous avez bien validé le paiement sur votre téléphone, il sera pris en compte dès réception : inutile de payer deux fois."
                    : "Aucun montant n'a été débité. Vous pouvez réessayer le paiement."}
                </p>
                {s.status !== "Cancelled" && s.status !== "Annule" && (
                  <button disabled={paying} onClick={async () => { setPaying(true); setPayMsg(await payOrder(s.orderId)); setPaying(false) }}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                    {paying ? "Ouverture du paiement…" : "Réessayer le paiement"}
                  </button>
                )}
                {payMsg && <p className="text-sm text-red-600">{payMsg}</p>}
              </div>
            )}
          </>
        )}
        <Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:underline">← Retour à la boutique</Link>
      </div>
    </main>
  )
}
