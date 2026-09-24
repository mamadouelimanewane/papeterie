"use client"

import { useEffect, useState } from "react"
import { Eye, Printer } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import ReportView from "@/components/admin/ReportView"
import { fmtDate, fmtMoney } from "@/lib/adminApi"

type Row = { id: string; [k: string]: unknown }
type Store = { name: string; address?: string | null; phone?: string | null; email?: string | null }
type Order = { orderId: string; createdAt: string; items: { name: string; price: number; qty: number }[]; subtotal: number; deliveryFee: number; total: number; paymentMethod: string; paymentStatus: string; address?: string | null; notes?: string | null; status: string }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))
const money = (n: number) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`

/** HTML autonome de la facture (imprimable / enregistrable en PDF). */
function invoiceHtml(o: Order, store: Store | null, client: string) {
  const lines = (o.items ?? []).map((i) => `<tr><td>${esc(i.name)}</td><td class="r">${i.qty ?? 1}</td><td class="r">${money(i.price)}</td><td class="r">${money((i.price || 0) * (i.qty || 1))}</td></tr>`).join("")
  const discount = Math.max(0, (o.subtotal || 0) - (o.total || 0))
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${esc(o.orderId)}</title>
<style>body{font-family:Arial,sans-serif;color:#1f2937;margin:40px;font-size:13px}h1{color:#4338ca;margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f9fafb;font-size:11px;text-transform:uppercase;color:#6b7280}.r{text-align:right}.head{display:flex;justify-content:space-between;gap:20px}.tot td{border:none;padding:4px 8px}.grand td{font-size:16px;font-weight:bold;color:#4338ca}.muted{color:#6b7280}@media print{button{display:none}}</style></head><body>
<div class="head"><div><h1>${esc(store?.name ?? "Schoolmatik Librairie")}</h1><div class="muted">${esc(store?.address ?? "Dakar, Sénégal")}<br>${esc(store?.phone ?? "")} ${esc(store?.email ?? "")}</div></div>
<div class="r"><h2 style="margin:0">FACTURE</h2><div>N° ${esc(o.orderId)}</div><div class="muted">${new Date(o.createdAt).toLocaleDateString("fr-FR")}</div></div></div>
<p style="margin-top:24px"><b>Client :</b> ${esc(client)}<br><b>Adresse de livraison :</b> ${esc(o.address ?? "—")}</p>
<table><thead><tr><th>Article</th><th class="r">Qté</th><th class="r">Prix unitaire</th><th class="r">Total</th></tr></thead><tbody>${lines}</tbody></table>
<table style="width:320px;margin-left:auto"><tbody class="tot">
<tr><td>Sous-total</td><td class="r">${money(o.subtotal)}</td></tr>
${discount ? `<tr><td>Remise</td><td class="r">-${money(discount)}</td></tr>` : ""}
<tr><td>Livraison</td><td class="r">${money(o.deliveryFee)}</td></tr>
<tr class="grand"><td>Total</td><td class="r">${money((o.total || 0) + (o.deliveryFee || 0))}</td></tr></tbody></table>
<p class="muted">Paiement : ${esc(o.paymentMethod)} — ${esc(o.paymentStatus)}</p>
<button onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#4338ca;color:#fff;border:0;border-radius:8px;cursor:pointer">Imprimer / Enregistrer en PDF</button>
</body></html>`
}

export default function InvoicesPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { fetch("/api/store").then((r) => r.json()).then(setStore).catch(() => {}) }, [])

  const build = async (r: Row) => {
    setBusy(r.id)
    try {
      const res = await fetch(`/api/orders/${r.id}`, { cache: "no-store" })
      const o = (await res.json()) as Order & { error?: string }
      if (!res.ok) throw new Error(o.error ?? "Commande introuvable")
      return invoiceHtml(o, store, String(r.user))
    } finally { setBusy(null) }
  }
  const view = async (r: Row) => { try { setPreview(await build(r)) } catch { /* affiché via l'aperçu vide */ } }
  const print = async (r: Row) => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(await build(r)); w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
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
