"use client"

import { useEffect, useState } from "react"
import StatusBadge from "@/components/ui/StatusBadge"
import { useFeedback, useAction } from "./Feedback"
import { adminFetch } from "@/lib/adminApi"

type Detail = {
  id: string; orderId: string; status: string; paymentStatus: string; paymentMethod: string
  driverId: string | null; notes: string | null; address: string | null
  items: { name?: string; qty?: number; price?: number }[] | null
}
type Driver = { id: string; name: string; phone?: string | null; status: string }

const PAID = ["Complete", "Completed", "Paye", "Payé", "Paid"]
/** Étapes du cycle de livraison, dans l'ordre. */
const STEPS = [
  { status: "Pending", label: "En attente" },
  { status: "Processing", label: "En préparation" },
  { status: "OnTheWay", label: "En livraison" },
  { status: "Delivered", label: "Livrée" },
]

/**
 * Pilotage d'une commande depuis le back-office : client, articles, attribution du livreur,
 * avancement du statut, encaissement (paiement à la livraison) et annulation.
 */
export default function OrderActions({ orderId, onChanged }: { orderId: string; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [busy, setBusy] = useState(false)
  const { confirm } = useFeedback()
  const run = useAction()

  useEffect(() => {
    let alive = true
    adminFetch<Detail>(`/api/orders/${orderId}`).then((o) => alive && setD(o)).catch(() => {})
    adminFetch<{ drivers: Driver[] }>("/api/drivers?approvalStatus=Approved&perPage=100").then((r) => alive && setDrivers(r.drivers)).catch(() => {})
    return () => { alive = false }
  }, [orderId])

  if (!d) return <div className="h-24 animate-pulse rounded-lg bg-gray-50" />

  const client = d.notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim()
  const phone = d.notes?.match(/Tél:\s*([^|]+)/)?.[1]?.trim()
  const paid = PAID.includes(d.paymentStatus)
  const closed = d.status === "Delivered" || d.status === "Completed" || d.status === "Cancelled"
  const stepIdx = STEPS.findIndex((s) => s.status === d.status)
  const next = !closed && stepIdx >= 0 ? STEPS[stepIdx + 1] : undefined

  const patch = async (data: Record<string, unknown>, ok: string) => {
    setBusy(true)
    const r = await run(() => adminFetch<Detail>(`/api/orders/${d.id}`, { method: "PATCH", body: data }), ok)
    setBusy(false)
    if (r) { setD({ ...d, ...r }); onChanged() }
  }

  return (
    <div className="space-y-4 border-t border-gray-100 p-4 text-sm">
      {/* Client & articles */}
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="text-xs font-semibold uppercase text-gray-400">Client</div>
        <div className="font-medium text-gray-800" data-no-i18n>{client || "—"}</div>
        {phone && <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-indigo-600 underline" data-no-i18n>{phone}</a>}
        {!!d.items?.length && (
          <ul className="mt-2 space-y-0.5 text-xs text-gray-600" data-no-i18n>
            {d.items.map((i, k) => <li key={k}>{i.qty ?? 1} × {i.name}</li>)}
          </ul>
        )}
      </div>

      {/* Livreur */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">Livreur</label>
        <select disabled={busy || closed} value={d.driverId ?? ""}
          onChange={(e) => patch({ driverId: e.target.value || null }, e.target.value ? "Livreur attribué" : "Livreur retiré")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50">
          <option value="">— Non assigné —</option>
          {drivers.map((x) => <option key={x.id} value={x.id}>{x.name}{x.phone ? ` (${x.phone})` : ""}{x.status === "Online" ? " · en ligne" : ""}</option>)}
        </select>
      </div>

      {/* Statut */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-400">Suivi</span>
          <StatusBadge status={d.status} />
        </div>
        <ol className="mb-3 flex gap-1">
          {STEPS.map((s, i) => (
            <li key={s.status} className={`flex-1 rounded px-1 py-1 text-center text-[11px] font-medium ${d.status === "Cancelled" ? "bg-gray-100 text-gray-400" : i <= stepIdx ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s.label}</li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {next && (
            <button disabled={busy} onClick={async () => {
              if (next.status === "Delivered" && !(await confirm({ title: "Marquer la commande comme livrée ?", message: paid ? undefined : "Pensez à enregistrer l'encaissement si le client a payé en espèces.", confirmLabel: "Livrée" }))) return
              patch({ status: next.status }, `Commande : ${next.label.toLowerCase()}`)
            }} className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              → {next.label}
            </button>
          )}
          {!closed && (
            <button disabled={busy} onClick={async () => {
              if (await confirm({ title: "Annuler cette commande ?", message: "Le stock des articles est restitué.", confirmLabel: "Annuler la commande", danger: true })) patch({ status: "Cancelled" }, "Commande annulée")
            }} className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50">Annuler</button>
          )}
        </div>
      </div>

      {/* Paiement */}
      <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-400">Paiement</div>
          <div className={paid ? "font-semibold text-emerald-600" : "text-amber-600"}>{paid ? "Payé ✓" : "Non payé"} <span className="text-xs text-gray-400">· {d.paymentMethod}</span></div>
        </div>
        {!paid && d.status !== "Cancelled" && (
          <button disabled={busy} onClick={async () => {
            if (await confirm({ title: "Enregistrer le paiement ?", message: "À utiliser pour un paiement en espèces à la livraison (les paiements en ligne sont confirmés automatiquement).", confirmLabel: "Paiement reçu" }))
              patch({ paymentStatus: "Payé" }, "Paiement enregistré")
          }} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Paiement reçu</button>
        )}
      </div>
    </div>
  )
}
