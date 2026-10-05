import { prisma } from "@/lib/prisma"

/**
 * Règlement d'une commande passée à « Livrée » (à appeler APRÈS la mise à jour du statut, uniquement quand l'ancien
 * statut n'était pas « livrée ») :
 *  - LIVREUR : crédité de ses frais de livraison (portefeuille + gains cumulés + nombre de livraisons),
 *    transaction « Gain livraison » (réf. LIV-<n° commande>) ;
 *  - BOUTIQUE : créditée du montant des articles moins la commission de la plateforme (subtotal − earning),
 *    transaction « Vente » (réf. VTE-<n° commande>). C'est ce solde que la boutique peut ensuite retirer.
 * Idempotent et sans doublon même si deux livraisons sont validées en même temps : la ligne de la commande est
 * verrouillée (SELECT … FOR UPDATE) pendant le contrôle et l'écriture.
 */
export async function settleDeliveredOrder(orderDbId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderDbId} FOR UPDATE`
    const order = await tx.order.findUnique({
      where: { id: orderDbId },
      select: { orderId: true, driverId: true, storeId: true, deliveryFee: true, subtotal: true, total: true, earning: true, status: true },
    })
    if (!order || !DELIVERED.includes(order.status)) return

    // Livreur
    const fee = Number(order.deliveryFee) || 0
    const driverReceipt = `LIV-${order.orderId}`
    if (order.driverId && fee > 0 && !(await tx.transaction.findFirst({ where: { receiptNo: driverReceipt }, select: { id: true } }))) {
      await tx.transaction.create({
        data: {
          driverId: order.driverId, amount: fee, type: "Crédit", method: "Livraison",
          description: `Gain livraison ${order.orderId}`, receiptNo: driverReceipt, status: "Completed",
        },
      })
      await tx.driver.update({
        where: { id: order.driverId },
        data: { walletMoney: { increment: fee }, earning: { increment: fee }, totalOrders: { increment: 1 } },
      })
    }

    // Boutique : ventes − commission
    const goods = Number(order.subtotal) || Number(order.total) - fee
    const storeShare = Math.max(0, goods - (Number(order.earning) || 0))
    const storeReceipt = `VTE-${order.orderId}`
    if (storeShare > 0 && !(await tx.transaction.findFirst({ where: { receiptNo: storeReceipt }, select: { id: true } }))) {
      await tx.transaction.create({
        data: {
          storeId: order.storeId, amount: storeShare, type: "Crédit", method: "Vente",
          description: `Vente ${order.orderId} (commission déduite)`, receiptNo: storeReceipt, status: "Completed",
        },
      })
      await tx.store.update({ where: { id: order.storeId }, data: { walletMoney: { increment: storeShare } } })
    }
  })
}

/** Ancien nom, conservé pour les appelants existants : règle désormais le livreur ET la boutique. */
export const creditDriverForDelivery = settleDeliveredOrder

export const DELIVERED = ["Delivered", "Completed"]
