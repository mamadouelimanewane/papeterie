import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Cas 1 : Réception des instructions de paiement
    if (body.type === 'PAYMENT_INSTRUCTIONS') {
      console.log('Instructions de paiement reçues:', body);
      return NextResponse.json({ success: true, message: 'Webhook reçu' }, { status: 200 });
    }

    // Cas 2 : Statut de la transaction
    if (body.type === 'TRANSACTION_STATUS') {
      console.log('Statut de transaction reçu:', body);
      
      const { external_reference, status, message, amount, reference } = body;

      // external_reference correspond à notre ID de commande
      if (!external_reference) {
        return NextResponse.json({ error: 'external_reference manquant' }, { status: 400 });
      }

      // Mapper le statut Versus vers notre statut interne
      let paymentStatus = 'En attente';
      let orderStatus = 'Pending';

      if (status === 'COMPLETED') {
        paymentStatus = 'Complété';
        orderStatus = 'Confirmé'; // Ou un autre statut adapté
      } else if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
        paymentStatus = 'Échoué';
        orderStatus = 'Annulé';
      }

      // Mise à jour de la commande
      const updatedOrder = await prisma.order.update({
        where: { id: external_reference },
        data: {
          paymentStatus,
          status: orderStatus,
          invoiceId: reference,
        }
      });

      // Si le paiement est complété, on crée/met à jour la transaction
      if (status === 'COMPLETED') {
         await prisma.transaction.create({
            data: {
              amount: parseFloat(amount) || updatedOrder.total,
              type: 'Paiement Commande',
              method: 'Versus',
              status: 'Completed',
              description: message || 'Paiement via webhook Versus',
              receiptNo: reference,
              storeId: updatedOrder.storeId,
              userId: updatedOrder.userId,
            }
         });
      }

      return NextResponse.json({ success: true, message: 'Commande mise à jour' }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'Type de webhook ignoré' }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur webhook Versus:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
