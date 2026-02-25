import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';

const NOWPAYMENTS_WEBHOOK_SECRET = "9T78Lrip+InkXZH7lYNzp+wSgDNEMdSS";

export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature du webhook en production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-nowpayments-sig');
      const body = await request.text();

      if (!signature || !NOWPAYMENTS_WEBHOOK_SECRET) {
        console.error('Webhook signature verification failed: Missing signature or secret');
        return NextResponse.json({ error: 'Missing signature or secret' }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac('sha512', NOWPAYMENTS_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Webhook signature verification failed: Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = await request.json();
    
    console.log('NowPayments webhook received:', data);

    const { 
      payment_id, 
      payment_status, 
      actually_paid,
      pay_amount,
      pay_currency,
      price_amount,
      price_currency
    } = data;

    // Trouver la transaction associée à ce payment_id
    const transaction = await prisma.transaction.findFirst({
      where: { 
        payment_id: payment_id.toString(),
        type: 'DEPOSIT'
      },
      include: {
        wallet: true,
        user: {
          include: {
            wallet: {
              where: { type: 'DEPOSIT' }
            }
          }
        }
      }
    });

    if (!transaction) {
      console.error(`Transaction not found for payment_id: ${payment_id}`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Mettre à jour le statut de la transaction seulement (sans créditer le wallet)
    let newStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'PENDING';
    let notificationMessage = '';
    
    switch (payment_status) {
      case 'waiting':
      case 'confirming':
        newStatus = 'PENDING';
        notificationMessage = `Paiement en cours de confirmation. Statut: ${payment_status}`;
        break;
      case 'finished':
      case 'confirmed':
        newStatus = 'COMPLETED';
        notificationMessage = `Paiement complété avec succès. Montant reçu: ${actually_paid || pay_amount} ${pay_currency}`;
        
        // NE PAS créditer le wallet automatiquement
        // Le crédit sera géré manuellement ou via un autre processus
        console.log(`Paiement ${payment_id} terminé - Wallet NON crédité automatiquement`);
        break;
      case 'failed':
        newStatus = 'FAILED';
        notificationMessage = 'Le paiement a échoué.';
        break;
      case 'expired':
        newStatus = 'CANCELLED';
        notificationMessage = 'Le paiement a expiré.';
        break;
      default:
        newStatus = 'PENDING';
        notificationMessage = `Statut de paiement mis à jour: ${payment_status}`;
    }

    // Mettre à jour la transaction avec le nouveau statut
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        metadata: {
          ...(transaction.metadata as any),
          webhook_received_at: new Date().toISOString(),
          payment_status: payment_status,
          actually_paid: actually_paid,
          last_webhook_data: data,
          last_status_update: new Date().toISOString()
        }
      },
      include: {
        wallet: true
      }
    });

    // Créer une notification pour informer l'utilisateur du changement de statut
    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          user_id: transaction.user_id,
          title: `Statut de dépôt - ${newStatus}`,
          message: notificationMessage,
          type: 'TRANSACTION',
          metadata: {
            transaction_id: transaction.id.toString(),
            payment_id: payment_id,
            old_status: transaction.status,
            new_status: newStatus,
            amount: transaction.amount,
          }
        }
      });
    }

    console.log(`Payment ${payment_id} status updated to: ${newStatus} (Wallet NOT credited)`);

    return NextResponse.json({ 
      received: true,
      transaction_updated: true,
      status: newStatus,
      wallet_credited: false // Explicitement indiquer que le wallet n'a pas été crédité
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'NowPayments webhook endpoint is active',
    environment: process.env.NODE_ENV,
    note: 'Transactions are created with PENDING status and wallets are NOT automatically credited'
  });
}