import { prisma } from "@/lib/prisma"

/**
 * Commande passée à « Livrée » : crédite le livreur de ses frais de livraison.
 * - portefeuille (walletMoney) + gains cumulés (earning) + nombre de livraisons (totalOrders) ;
 * - trace une transaction « Gain livraison » (référence LIV-<n° commande>) ;
 * - idempotent : si cette référence existe déjà, rien n'est crédité une seconde fois.
 * À appeler APRÈS la mise à jour du statut, uniquement quand l'ancien statut n'était pas « livrée ».
 */
export async function creditDriverForDelivery(orderDbId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderDbId },
    select: { orderId: true, driverId: true, deliveryFee: true, status: true },
  })
  if (!order?.driverId || order.status !== "Delivered") return
  const amount = Number(order.deliveryFee) || 0
  if (amount <= 0) return

  const receiptNo = `LIV-${order.orderId}`
  const already = await prisma.transaction.findFirst({ where: { receiptNo }, select: { id: true } })
  if (already) return

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        driverId: order.driverId, amount, type: "Crédit", method: "Livraison",
        description: `Gain livraison ${order.orderId}`, receiptNo, status: "Completed",
      },
    }),
    prisma.driver.update({
      where: { id: order.driverId },
      data: { walletMoney: { increment: amount }, earning: { increment: amount }, totalOrders: { increment: 1 } },
    }),
  ])
}

export const DELIVERED = ["Delivered", "Completed"]
