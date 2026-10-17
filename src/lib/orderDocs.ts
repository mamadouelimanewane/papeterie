/**
 * Documents imprimables d'une commande (HTML autonome, « Imprimer / Enregistrer en PDF ») :
 * facture et bon de livraison. Utilisés par la page Factures et la fiche commande.
 */

export type DocStore = { name: string; address?: string | null; phone?: string | null; email?: string | null }
export type DocOrder = {
  orderId: string; createdAt: string; status: string
  items: { name: string; price: number; qty?: number; quantity?: number }[] | null
  subtotal: number; deliveryFee: number; total: number
  paymentMethod: string; paymentStatus: string
  address?: string | null; notes?: string | null
  driver?: { name?: string | null; phone?: string | null } | null
}

const PAID = ["Complete", "Completed", "Paye", "Payé", "Paid"]
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))
const money = (n: number) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`
const qty = (i: { qty?: number; quantity?: number }) => i.quantity ?? i.qty ?? 1

/** Client saisi à la commande (nom, téléphone) et créneau de livraison choisi, lus dans les notes. */
export function orderNotesInfo(notes?: string | null) {
  return {
    client: notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim() || "",
    phone: notes?.match(/Tél:\s*([^|]+)/)?.[1]?.trim() || "",
    slot: notes?.match(/\[Créneau:\s*([^\]]+)\]/)?.[1]?.trim() || "",
  }
}

const STYLE = `body{font-family:Arial,sans-serif;color:#1f2937;margin:40px;font-size:13px}h1{color:#A3121B;margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f9fafb;font-size:11px;text-transform:uppercase;color:#6b7280}.r{text-align:right}.c{text-align:center}.head{display:flex;justify-content:space-between;gap:20px}.tot td{border:none;padding:4px 8px}.grand td{font-size:16px;font-weight:bold;color:#A3121B}.muted{color:#6b7280}.box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-top:16px}.sign{display:flex;gap:24px;margin-top:40px}.sign div{flex:1;border-top:1px solid #9ca3af;padding-top:6px;color:#6b7280;font-size:12px}@media print{button{display:none}}`
const PRINT = `<button onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#A3121B;color:#fff;border:0;border-radius:8px;cursor:pointer">Imprimer / Enregistrer en PDF</button>`

function header(store: DocStore | null, title: string, o: DocOrder) {
  return `<div class="head"><div><h1>${esc(store?.name ?? "Schoolmatik Librairie")}</h1><div class="muted">${esc(store?.address ?? "Dakar, Sénégal")}<br>${esc(store?.phone ?? "")} ${esc(store?.email ?? "")}</div></div>
<div class="r"><h2 style="margin:0">${title}</h2><div>N° ${esc(o.orderId)}</div><div class="muted">${new Date(o.createdAt).toLocaleDateString("fr-FR")}</div></div></div>`
}

/** Facture : articles, prix, remise, livraison, total. */
export function invoiceHtml(o: DocOrder, store: DocStore | null, client?: string) {
  const info = orderNotesInfo(o.notes)
  const lines = (o.items ?? []).map((i) => `<tr><td>${esc(i.name)}</td><td class="r">${qty(i)}</td><td class="r">${money(i.price)}</td><td class="r">${money((i.price || 0) * qty(i))}</td></tr>`).join("")
  // total = montant dû, livraison comprise (convention application mobile et boutique web)
  const discount = Math.max(0, (o.subtotal || 0) + (o.deliveryFee || 0) - (o.total || 0))
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${esc(o.orderId)}</title><style>${STYLE}</style></head><body>
${header(store, "FACTURE", o)}
<p style="margin-top:24px"><b>Client :</b> ${esc(client || info.client || "—")}<br><b>Adresse de livraison :</b> ${esc(o.address ?? "—")}</p>
<table><thead><tr><th>Article</th><th class="r">Qté</th><th class="r">Prix unitaire</th><th class="r">Total</th></tr></thead><tbody>${lines}</tbody></table>
<table style="width:320px;margin-left:auto"><tbody class="tot">
<tr><td>Sous-total</td><td class="r">${money(o.subtotal)}</td></tr>
${discount ? `<tr><td>Remise</td><td class="r">-${money(discount)}</td></tr>` : ""}
<tr><td>Livraison</td><td class="r">${money(o.deliveryFee)}</td></tr>
<tr class="grand"><td>Total</td><td class="r">${money(o.total || 0)}</td></tr></tbody></table>
<p class="muted">Paiement : ${esc(o.paymentMethod)} — ${esc(o.paymentStatus)}</p>
${PRINT}
</body></html>`
}

/** Bon de livraison : à remettre au livreur et à faire signer au client (sans les prix des articles). */
export function deliveryNoteHtml(o: DocOrder, store: DocStore | null) {
  const info = orderNotesInfo(o.notes)
  const paid = PAID.includes(o.paymentStatus)
  const lines = (o.items ?? []).map((i) => `<tr><td class="c" style="width:40px">☐</td><td>${esc(i.name)}</td><td class="r">${qty(i)}</td></tr>`).join("")
  const count = (o.items ?? []).reduce((s, i) => s + qty(i), 0)
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bon de livraison ${esc(o.orderId)}</title><style>${STYLE}</style></head><body>
${header(store, "BON DE LIVRAISON", o)}
<div class="box"><b>Client :</b> ${esc(info.client || "—")}${info.phone ? ` — <b>Tél. :</b> ${esc(info.phone)}` : ""}<br>
<b>Adresse :</b> ${esc(o.address ?? "—")}${info.slot ? `<br><b>Créneau :</b> ${esc(info.slot)}` : ""}${o.driver?.name ? `<br><b>Livreur :</b> ${esc(o.driver.name)}${o.driver.phone ? ` (${esc(o.driver.phone)})` : ""}` : ""}</div>
<table><thead><tr><th class="c">✓</th><th>Article</th><th class="r">Qté</th></tr></thead><tbody>${lines}</tbody>
<tfoot><tr><td></td><td><b>Total articles</b></td><td class="r"><b>${count}</b></td></tr></tfoot></table>
<div class="box" style="font-size:15px">${paid ? "<b>Déjà payé</b> — rien à encaisser." : `<b>À encaisser à la livraison : ${money(o.total)}</b> (${esc(o.paymentMethod)})`}</div>
<p class="muted">Le client remet son code de livraison au livreur à la réception.</p>
<div class="sign"><div>Préparé par (boutique)</div><div>Livreur</div><div>Reçu par le client (nom, date, signature)</div></div>
${PRINT}
</body></html>`
}

/**
 * Ouvre le document dans un nouvel onglet et lance l'impression. L'onglet est ouvert tout de suite
 * (pendant le clic, sinon le navigateur le bloque), puis rempli quand le document est prêt.
 */
export async function openPrintable(html: string | Promise<string>) {
  const w = window.open("", "_blank")
  if (!w) throw new Error("Autorisez l'ouverture des fenêtres pour imprimer")
  w.document.write("<p style='font-family:Arial;padding:40px;color:#6b7280'>Préparation du document…</p>")
  try {
    const doc = await html
    w.document.open(); w.document.write(doc); w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  } catch (e) { w.close(); throw e }
}
