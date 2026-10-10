"use client"

import type { ReceiptData } from "@/lib/receipt"

const money = (n: number, currency: string) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} ${currency === "FCFA" ? "F CFA" : currency}`

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dakar" })

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Reçu de paiement présentable (écran et impression A4).
 * Toute la mise en page « papier » est ici ; l'impression masque le reste de la page (classe print:hidden ailleurs).
 */
export default function Receipt({ r }: { r: ReceiptData }) {
  const s = r.seller
  const cur = r.currency
  const legal = [s.ninea && `NINEA ${s.ninea}`, s.rccm && `RCCM ${s.rccm}`].filter(Boolean).join(" · ")

  return (
    <article
      id="receipt"
      className="relative w-full overflow-hidden rounded-2xl bg-white text-left text-slate-800 shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0"
    >
      {/* Bandeau de couleur de la marque */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

      <div className="p-6 sm:p-10 print:p-0 print:pt-6">
        {/* En-tête : vendeur / titre du document */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between">
          <div className="flex items-start gap-3">
            {s.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-black text-white">
                {s.name.charAt(0)}
              </div>
            )}
            <div className="text-sm leading-relaxed">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">{s.name}</p>
              {s.legalName && s.legalName !== s.name && <p className="text-slate-600">{s.legalName}</p>}
              {s.address && <p className="text-slate-500">{s.address}</p>}
              <p className="text-slate-500">{[s.phone, s.email].filter(Boolean).join(" · ")}</p>
            </div>
          </div>

          <div className="sm:text-right print:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">Reçu de paiement</p>
            <p className="mt-1 font-mono text-base font-bold text-slate-900">{r.receiptNo}</p>
            <p className="text-sm text-slate-500">{dateTime(r.paidAt)}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Payé
            </span>
          </div>
        </header>

        {/* Client / commande */}
        <section className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 print:grid-cols-2 print:bg-white print:ring-1 print:ring-slate-200">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</p>
            <p className="mt-1 font-semibold text-slate-900">{r.customer.name ?? "Client"}</p>
            {r.customer.phone && <p className="text-slate-600">{r.customer.phone}</p>}
            {r.customer.address && <p className="text-slate-600">{r.customer.address}</p>}
          </div>
          <div className="sm:text-right print:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Commande</p>
            <p className="mt-1 font-mono font-semibold text-slate-900">{r.orderId}</p>
            <p className="text-slate-600">Passée le {dateTime(r.orderedAt)}</p>
          </div>
        </section>

        {/* Articles */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 text-left font-semibold">Désignation</th>
              <th className="w-12 pb-2 text-right font-semibold">Qté</th>
              <th className="hidden w-28 pb-2 text-right font-semibold sm:table-cell print:table-cell">P.U.</th>
              <th className="w-28 pb-2 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-100 align-top break-inside-avoid">
                <td className="py-3 pr-3">
                  <p className="font-medium text-slate-900">{l.name}</p>
                  {l.details && <p className="mt-0.5 text-xs text-slate-500">{l.details}</p>}
                  <p className="text-xs text-slate-500 sm:hidden print:hidden">{money(l.unitPrice, cur)} l&apos;unité</p>
                </td>
                <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                <td className="hidden py-3 text-right tabular-nums sm:table-cell print:table-cell">{money(l.unitPrice, cur)}</td>
                <td className="py-3 text-right font-medium tabular-nums">{money(l.total, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Sous-total articles</dt><dd className="tabular-nums">{money(r.subtotal, cur)}</dd></div>
            {r.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Remise{r.promoCode ? ` (${r.promoCode})` : ""}</dt><dd className="tabular-nums">− {money(r.discount, cur)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">Livraison</dt><dd className="tabular-nums">{r.deliveryFee > 0 ? money(r.deliveryFee, cur) : "Offerte"}</dd></div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-slate-900 pt-3">
              <dt className="font-bold text-slate-900">Total payé</dt>
              <dd className="text-xl font-extrabold tabular-nums text-indigo-700 print:text-slate-900">{money(r.total, cur)}</dd>
            </div>
          </dl>
        </div>

        {cur === "FCFA" && (
          <p className="mt-6 text-sm italic text-slate-600">
            Arrêté le présent reçu à la somme de <span className="font-semibold not-italic text-slate-800">{capitalize(r.totalInWords)} francs CFA</span>.
          </p>
        )}

        {/* Paiement */}
        <section className="mt-6 grid gap-2 border-t border-dashed border-slate-300 pt-5 text-sm sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mode de paiement</p>
            <p className="mt-1 text-slate-800">{r.payment.method}</p>
          </div>
          {r.payment.reference && (
            <div className="sm:text-right print:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Référence de la transaction</p>
              <p className="mt-1 break-all font-mono text-slate-800">{r.payment.reference}</p>
            </div>
          )}
        </section>

        {/* Pied */}
        <footer className="mt-10 text-center text-xs leading-relaxed text-slate-500">
          {r.footer && <p className="text-sm font-medium text-slate-700">{r.footer}</p>}
          <p className="mt-2">Ce reçu atteste du paiement de la commande ci-dessus. Conservez-le pour tout échange ou réclamation.</p>
          {(s.legalName || legal) && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              {[s.legalName, legal].filter(Boolean).join(" — ")}
            </p>
          )}
        </footer>
      </div>
    </article>
  )
}
