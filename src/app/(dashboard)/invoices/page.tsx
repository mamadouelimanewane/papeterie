"use client"

import { useEffect, useState } from "react"
import { Eye, Printer } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import ReportView from "@/components/admin/ReportView"
import { fmtDate, fmtMoney } from "@/lib/adminApi"
import { invoiceHtml, openPrintable, type DocOrder, type DocStore } from "@/lib/orderDocs"

type Row = { id: string; [k: string]: unknown }

export default function InvoicesPage() {
  const [store, setStore] = useState<DocStore | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { fetch("/api/store").then((r) => r.json()).then(setStore).catch(() => {}) }, [])

  const build = async (r: Row) => {
    setBusy(r.id)
    try {
      const res = await fetch(`/api/orders/${r.id}`, { cache: "no-store" })
      const o = (await res.json()) as DocOrder & { error?: string }
      if (!res.ok) throw new Error(o.error ?? "Commande introuvable")
      return invoiceHtml(o, store, String(r.user))
    } finally { setBusy(null) }
  }
  const view = async (r: Row) => { try { setPreview(await build(r)) } catch { /* affiché via l'aperçu vide */ } }
  const print = async (r: Row) => {
    openPrintable(build(r)).catch(() => {}) // fenêtre bloquée ou commande introuvable : rien à imprimer
  }

  return (
    <>
      <ReportView
        title="Factures commandes" icon="🧾" kind="earnings" exportName="factures" searchPlaceholder="N° commande, client..."
        columns={[
          { key: "orderId", label: "N° Facture", render: (r) => <span className="font-semibold text-blue-600">FAC-{String(r.orderId)}</span>, csv: (r) => `FAC-${r.orderId}` },
          { key: "store", label: "Boutique" },
          { key: "user", label: "Client" },
          { key: "total", label: "Montant (FCFA)", render: (r) => <span className="font-semibold">{Number(r.total).toLocaleString("fr-FR")}</span> },
          { key: "paymentStatus", label: "Paiement", render: (r) => <StatusBadge status={String(r.paymentStatus)} /> },
          { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-xs text-gray-500">{fmtDate(r.date)}</span>, csv: (r) => fmtDate(r.date) },
          { key: "status", label: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
          { key: "_actions", label: "Action", render: (r) => (
            <div className="flex gap-1">
              <button onClick={() => view(r)} disabled={busy === r.id} className="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600 disabled:opacity-50" title="Voir"><Eye size={12} /></button>
              <button onClick={() => print(r)} disabled={busy === r.id} className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600 disabled:opacity-50" title="Imprimer / PDF"><Printer size={12} /></button>
            </div>
          ), csv: () => "" },
        ]}
        kpis={(rows) => [
          { label: "Factures", value: rows.length, color: "bg-blue-500" },
          { label: "Montant facturé", value: fmtMoney(rows.reduce((s, r) => s + Number(r.total), 0)), color: "bg-green-500" },
          { label: "En attente de paiement", value: rows.filter((r) => String(r.paymentStatus).toLowerCase().includes("attente")).length, color: "bg-yellow-500" },
        ]}
      />
      {preview !== null && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className="h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <iframe title="Facture" srcDoc={preview} className="h-full w-full" />
          </div>
        </div>
      )}
    </>
  )
}
