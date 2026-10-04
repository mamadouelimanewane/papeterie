import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PAID_STATUSES } from "@/lib/orderPayment"

/** 9 derniers chiffres : « +221 77 123 45 67 », « 771234567 » et « 00221771234567 » sont équivalents. */
const normPhone = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9)

/**
 * « Mes commandes » de la vitrine, protégé par le numéro de téléphone.
 * Corps : { phone, orderIds } — ne renvoie QUE les commandes passées avec ce numéro
 * (téléphone saisi à la commande, ou téléphone du compte client). Aucune donnée personnelle renvoyée.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, orderIds } = await req.json().catch(() => ({}))
    const p = normPhone(phone)
    if (p.length !== 9) return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 })
    if (!Array.isArray(orderIds) || !orderIds.length) return NextResponse.json({ orders: [] })
    const ids = orderIds.filter((x): x is string => typeof x === "string" && /^[A-Z0-9-]{4,60}$/i.test(x)).slice(0, 20)

    const orders = await prisma.order.findMany({
      where: { orderId: { in: ids } },
      select: { orderId: true, status: true, paymentStatus: true, paymentMethod: true, total: true, createdAt: true, notes: true, userId: true, deliveryOtp: true },
    })
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))] as string[]
    const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, phone: true } }) : []
    const userPhone = new Map(users.map((u) => [u.id, normPhone(u.phone)]))

    const mine = orders.filter((o) => {
      const tel = normPhone(o.notes?.match(/Tél:\s*([^|]+)/)?.[1])
      return (tel.length === 9 && tel === p) || (!!o.userId && userPhone.get(o.userId) === p)
    })
    return NextResponse.json({
      orders: mine.map((o) => ({
        orderId: o.orderId, status: o.status, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod,
        total: o.total, createdAt: o.createdAt, paid: PAID_STATUSES.includes(o.paymentStatus),
        // Code à donner au livreur : seulement au titulaire du numéro, et tant que la commande est en cours
        deliveryCode: ["Delivered", "Completed", "Cancelled"].includes(o.status) ? null : o.deliveryOtp,
      })),
    })
  } catch (e) {
    console.error("[shop/my-orders]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
