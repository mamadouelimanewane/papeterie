import { createVersusPayment } from "@/lib/versus"

type OrderForPayment = { id: string; orderId: string; total: number; notes?: string | null }

/** Statuts de paiement considérés comme réglés (webhook Versus : "Complete" ; saisie manuelle : "Payé"). */
export const PAID_STATUSES = ["Complete", "Completed", "Paye", "Payé", "Paid"]

/** Lien de paiement renvoyé par Versus (la forme de la réponse varie selon l'API). */
export function paymentLink(paymentData: unknown): string | null {
  const d = paymentData as { data?: { link?: string; data?: { link?: string } } } | null
  return d?.data?.data?.link ?? d?.data?.link ?? null
}

/** Nom du client d'une commande invité, conservé dans les notes : « Client: Awa Diop | Tél: … | ». */
export function customerFromNotes(notes?: string | null) {
  const name = notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim() ?? ""
  const phone = notes?.match(/Tél:\s*([^|]+)/)?.[1]?.trim() ?? ""
  const [first, ...rest] = name.split(/\s+/).filter(Boolean)
  return { firstName: first ?? "Client", lastName: rest.join(" ") || "Schoolmatik", phone }
}

/**
 * Initie un paiement Versus (Wave, Orange Money, carte, Mixx) pour une commande.
 * Le montant payé est `order.total`, qui inclut les frais de livraison.
 */
export async function startOrderPayment(
  order: OrderForPayment,
  host: string,
  customer?: { firstName?: string; lastName?: string; phone?: string; serviceId?: number; accountNumber?: string },
) {
  const fromNotes = customerFromNotes(order.notes)
  const base = `https://${host}`
  const result = await createVersusPayment({
    name: "Commande Schoolmatik " + order.orderId,
    first_name: customer?.firstName || fromNotes.firstName,
    last_name: customer?.lastName || fromNotes.lastName,
    external_reference: order.id, // retrouvé par le webhook
    order_reference: order.orderId,
    amount: order.total,
    currency: "XOF",
    phone_number: customer?.phone || fromNotes.phone || undefined,
    success_url: `${base}/checkout/success?orderId=${encodeURIComponent(order.orderId)}`,
    failure_url: `${base}/checkout/failure?orderId=${encodeURIComponent(order.orderId)}`,
    ...(customer?.serviceId && customer?.accountNumber
      ? { service_id: customer.serviceId, payment_account_number: customer.accountNumber }
      : {}), // Mobile Money direct
  })
  return result.success
    ? { ok: true as const, paymentData: result, link: paymentLink(result) }
    : { ok: false as const, error: result.message ?? "Échec de l'initialisation du paiement Versus" }
}
