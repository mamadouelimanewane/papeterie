"use client"

import { useEffect, useState } from "react"
import { FileText, Truck } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import { useFeedback, useAction } from "./Feedback"
import { adminFetch } from "@/lib/adminApi"
import { deliveryNoteHtml, invoiceHtml, openPrintable, orderNotesInfo, type DocOrder, type DocStore } from "@/lib/orderDocs"

type Detail = {
  id: string; orderId: string; status: string; paymentStatus: string; paymentMethod: string
  driverId: string | null; notes: string | null; address: string | null; pickupOtp: string | null
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
  const [refund, setRefund] = useState({ method: "Wave", reference: "" })
  const { confirm } = useFeedback()
  const run = useAction()

  useEffect(() => {
    let alive = true
    adminFetch<Detail>(`/api/orders/${orderId}`).then((o) => alive && setD(o)).catch(() => {})
    adminFetch<{ drivers: Driver[] }>("/api/drivers?approvalStatus=Approved&perPage=100").then((r) => alive && setDrivers(r.drivers)).catch(() => {})
    return () => { alive = false }
  }, [orderId])

  if (!d) return <div className="h-24 animate-pulse rounded-lg bg-gray-50" />

  const { client, phone, slot } = orderNotesInfo(d.notes)
  // Documents imprimables : la commande complète et la boutique sont relues au moment du clic
  const printDoc = (kind: "invoice" | "delivery") => openPrintable(Promise.all([
    adminFetch<DocOrder>(`/api/orders/${d.id}`),
    fetch("/api/store").then((r) => r.json() as Promise<DocStore>).catch(() => null),
  ]).then(([o, store]) => (kind === "invoice" ? invoiceHtml(o, store) : deliveryNoteHtml(o, store))))
  const paid = PAID.includes(d.paymentStatus)
  const closed = ["Delivered", "Completed", "Cancelled", "Annule"].includes(d.status)
  // Statuts posés par l'application livreur, ramenés aux étapes affichées
  const ALIAS: Record<string, string> = { Accepted: "Processing", PickedUp: "OnTheWay", Picked: "OnTheWay", Delivering: "OnTheWay", Completed: "Delivered" }
  const stepIdx = STEPS.findIndex((s) => s.status === (ALIAS[d.status] ?? d.status))
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
        {phone && <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-brand-600 underline" data-no-i18n>{phone}</a>}
        {!!d.items?.length && (
          <ul className="mt-2 space-y-0.5 text-xs text-gray-600" data-no-i18n>
            {d.items.map((i, k) => <li key={k}>{i.qty ?? 1} × {i.name}</li>)}
          </ul>
        )}
        {slot && <div className="mt-2 text-xs font-semibold text-brand-700" data-no-i18n>Créneau : {slot}</div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => run(() => printDoc("delivery"))} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"><Truck size={13} /> Bon de livraison</button>
          <button onClick={() => run(() => printDoc("invoice"))} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"><FileText size={13} /> Facture</button>
        </div>
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

      {/* Code de ramassage : à donner au livreur quand il vient chercher la commande */}
      {d.pickupOtp && d.driverId && !closed && ["Pending", "Accepted"].includes(d.status) && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="text-xs text-amber-800">Code de ramassage à donner au livreur</span>
          <span className="font-mono text-lg font-bold tracking-widest text-amber-900" data-no-i18n>{d.pickupOtp}</span>
        </div>
      )}

      {/* Statut */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-400">Suivi</span>
          <StatusBadge status={d.status} />
        </div>
        <ol className="mb-3 flex gap-1">
          {STEPS.map((s, i) => (
            <li key={s.status} className={`flex-1 rounded px-1 py-1 text-center text-[11px] font-medium ${d.status === "Cancelled" ? "bg-gray-100 text-gray-400" : i <= stepIdx ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s.label}</li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {next && (
            <button disabled={busy} onClick={async () => {
              if (next.status === "Delivered" && !(await confirm({ title: "Marquer la commande comme livrée ?", message: paid ? undefined : "Pensez à enregistrer l'encaissement si le client a payé en espèces.", confirmLabel: "Livrée" }))) return
              patch({ status: next.status }, `Commande : ${next.label.toLowerCase()}`)
            }} className="flex-1 rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
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

      {/* Paiement reçu alors que le stock n'était plus disponible : à rembourser au client */}
      {d.paymentStatus === "A rembourser" && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-xs font-semibold uppercase text-red-700">À rembourser</div>
          <p className="text-xs text-red-700">Le client a payé mais un article n&apos;était plus en stock. Remboursez-le, puis enregistrez le remboursement ici : il recevra un e-mail de confirmation (s&apos;il a une adresse).</p>
          <div className="flex flex-wrap gap-2">
            <select value={refund.method} onChange={(e) => setRefund({ ...refund, method: e.target.value })} className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs">
              {["Wave", "Orange Money", "Free Money", "Espèces", "Virement", "Versus"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input value={refund.reference} onChange={(e) => setRefund({ ...refund, reference: e.target.value })} placeholder="Référence (facultatif)" className="min-w-0 flex-1 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs" />
            <button disabled={busy} onClick={async () => {
              if (!(await confirm({ title: "Confirmer le remboursement ?", message: `Remboursement par ${refund.method}. La commande sera clôturée.`, confirmLabel: "Remboursé" }))) return
              setBusy(true)
              const r = await run(() => adminFetch<{ paymentStatus: string; status: string }>(`/api/admin/orders/${d.id}/refund`, { method: "POST", body: refund }), "Remboursement enregistré")
              setBusy(false)
              if (r) { setD({ ...d, ...r }); onChanged() }
            }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">Marquer remboursé</button>
          </div>
        </div>
      )}

      {/* Paiement */}
      <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-400">Paiement</div>
          <div className={paid ? "font-semibold text-emerald-600" : "text-amber-600"}>{paid ? "Payé ✓" : d.paymentStatus === "Rembourse" ? "Remboursé" : d.paymentStatus === "A rembourser" ? "À rembourser" : "Non payé"} <span className="text-xs text-gray-400">· {d.paymentMethod}</span></div>
        </div>
        {!paid && !["Cancelled", "Annule"].includes(d.status) && !["A rembourser", "Rembourse"].includes(d.paymentStatus) && (
          <button disabled={busy} onClick={async () => {
            if (await confirm({ title: "Enregistrer le paiement ?", message: "À utiliser pour un paiement en espèces à la livraison (les paiements en ligne sont confirmés automatiquement).", confirmLabel: "Paiement reçu" }))
              patch({ paymentStatus: "Payé" }, "Paiement enregistré")
          }} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Paiement reçu</button>
        )}
      </div>
    </div>
  )
}
