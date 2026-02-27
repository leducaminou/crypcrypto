import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';

const NOWPAYMENTS_WEBHOOK_SECRET = process.env.NOWPAYMENTS_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-nowpayments-sig');

      if (!signature || !NOWPAYMENTS_WEBHOOK_SECRET) {
        console.error('Webhook signature verification failed: Missing signature or secret');
        return NextResponse.json({ error: 'Missing signature or secret' }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac('sha512', NOWPAYMENTS_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Webhook signature verification failed: Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(rawBody);
    console.log('NowPayments webhook received:', data);

    const {
      payment_id,
      payment_status,
      actually_paid,
      pay_amount,
      pay_currency,
      price_amount,   // USD amount
      price_currency,
    } = data;

    // Find the transaction linked to this payment_id
    const transaction = await prisma.transaction.findFirst({
      where: {
        payment_id: payment_id.toString(),
        type: 'DEPOSIT',
      },
    });

    if (!transaction) {
      console.error(`Transaction not found for payment_id: ${payment_id}`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    let notificationTitle = '';
    let notificationMessage = '';
    
    // IMPORTANT: AS REQUESTED BY USER, ALL DEPOSITS ARE MANUALLY APPROVED BY ADMIN
    // Therefore, we DO NOT credit the wallet automatically. We just update the transaction
    // metadata and fields so the admin can verify it and approve it manually.

    switch (payment_status) {
      case 'waiting':
      case 'confirming':
        notificationTitle = 'Paiement crypto en cours';
        notificationMessage = `Votre paiement crypto est en cours de confirmation par le réseau.`;
        break;

      case 'finished':
      case 'confirmed':
        notificationTitle = 'Paiement crypto reçu ⏳';
        notificationMessage = `Votre dépôt crypto de $${price_amount} USD (${actually_paid} ${pay_currency?.toUpperCase()}) a été réceptionné. Il est en attente de validation par un administrateur.`;

        // We leave the status as PENDING (or update to PENDING if it wasn't) 
        // to ensure it stays in the admin deposit queue.
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            // DO NOT SET TO COMPLETED - Admin must approve manually
            actually_paid: actually_paid ? parseFloat(actually_paid.toString()) : null,
            original_currency: pay_currency?.toUpperCase() ?? null,
            original_amount: actually_paid ? parseFloat(actually_paid.toString()) : null,
            exchange_rate: (actually_paid && price_amount && actually_paid > 0)
              ? parseFloat((price_amount / actually_paid).toFixed(10))
              : null,
            metadata: {
              ...(transaction.metadata as any ?? {}),
              webhook_received_at: new Date().toISOString(),
              payment_status,
              provider_status: 'finished', // Flag for admin validation
              actually_paid,
              pay_currency,
              price_amount,
              price_currency,
              last_webhook_data: data,
            },
          },
        });
        break;

      case 'failed':
        notificationTitle = 'Paiement échoué';
        notificationMessage = 'Votre paiement crypto a échoué. Veuillez réessayer.';
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(transaction.metadata as any ?? {}),
              webhook_received_at: new Date().toISOString(),
              payment_status,
            },
          },
        });
        break;

      case 'expired':
        notificationTitle = 'Paiement expiré';
        notificationMessage = 'Votre paiement crypto a expiré. Veuillez créer un nouveau paiement.';
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'CANCELLED', // Mark as cancelled since it expired
            metadata: {
              ...(transaction.metadata as any ?? {}),
              webhook_received_at: new Date().toISOString(),
              payment_status,
            },
          },
        });
        break;

      default:
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any ?? {}),
              webhook_received_at: new Date().toISOString(),
              payment_status,
            },
          },
        });
    }

    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          user_id: transaction.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'TRANSACTION',
          metadata: {
            transaction_id: transaction.id.toString(),
            payment_id,
            amount: transaction.amount,
          },
        },
      });
    }

    console.log(`Payment ${payment_id}: provider_status=${payment_status} (MANUAL ADMIN VALIDATION REQUIRED)`);

    return NextResponse.json({
      received: true,
      transaction_updated: true,
      status: transaction.status,
      manual_approval_required: true,
    });
  } catch (error: any) {
    console.error('Error processing NowPayments webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FiguraNex — NowPayments webhook endpoint is active (Manual Validation Mode)',
    environment: process.env.NODE_ENV,
  });
}