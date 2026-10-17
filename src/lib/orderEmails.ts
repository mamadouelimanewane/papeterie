import { prisma } from "@/lib/prisma"
import { customerFromNotes } from "@/lib/orderPayment"
import { sendEventMail } from "@/lib/mailer"

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`

/** Client d'une commande : compte (si connecté) ou nom saisi à la commande (invité). */
async function context(orderDbId: string) {
  const o = await prisma.order.findUnique({
    where: { id: orderDbId },
    select: { orderId: true, total: true, userId: true, notes: true, store: { select: { name: true, email: true } } },
  })
  if (!o) return null
  const user = o.userId ? await prisma.user.findUnique({ where: { id: o.userId }, select: { name: true, email: true } }) : null
  const guest = customerFromNotes(o.notes)
  return {
    o, email: user?.email ?? null,
    vars: { name: user?.name ?? guest.firstName, order_id: o.orderId, total: fcfa(o.total), store: o.store?.name ?? "Schoolmatik Librairie" },
  }
}

/** Paiement confirmé : confirmation au client + alerte « nouvelle commande payée » à la boutique. */
export async function notifyOrderPaid(orderDbId: string) {
  const c = await context(orderDbId)
  if (!c) return
  const admin = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/orders`
  await Promise.all([
    sendEventMail("order_placed", c.email, c.vars),
    sendEventMail("store_new_order", c.o.store?.email, { ...c.vars, link: admin }),
  ])
}

export async function notifyOrderDelivered(orderDbId: string) {
  const c = await context(orderDbId)
  if (c) await sendEventMail("order_delivered", c.email, c.vars)
}

export async function notifyOrderRefunded(orderDbId: string) {
  const c = await context(orderDbId)
  if (c) await sendEventMail("order_refunded", c.email, c.vars)
}
