import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from '@prisma/client';

// Interface pour la réponse API (avec BigInt convertis en string)
interface TransactionResponse {
  id: string;
  reference: string;
  user_id: string;
  wallet_id: string;
  payment_account_id: string | null;
  txid: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string | null;
  wallet_address: string | null;
  details: string | null;
  metadata: any | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  paymentAccount?: {
    id: string;
    type: PaymentMethod;
    account_identifier: string;
    provider: string;
  } | null;
}

// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id

    // Valider l'ID
    console.log('Received user_id:', id);
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupérer les transactions avec Prisma
    const transactions = await prisma.transaction.findMany({
      where: { user_id: BigInt(id) },
      include: {
        paymentAccount: {
          select: {
            id: true,
            type: true,
            account_identifier: true,
            provider: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc', // Tri par date décroissante
      },
    });


    // Vérifier si des transactions existent
    if (transactions.length === 0) {
      return NextResponse.json([], { status: 200 }); // Retourner un tableau vide plutôt qu'une erreur
    }
    const transactionsResponse: TransactionResponse[] = transactions.map((transaction) => {
      return {
        id: transaction.id.toString(),
        reference: transaction.reference,
        user_id: transaction.user_id.toString(),
        wallet_id: transaction.wallet_id.toString(),
        payment_account_id: transaction.payment_account_id?.toString() || null,
        txid: transaction.txid,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount.toString(),
        fee: transaction.fee?.toString() || null,
        wallet_address: transaction.wallet_address,
        details: transaction.details,
        metadata: transaction.metadata,
        processed_at: transaction.processed_at?.toISOString() || null,
        created_at: transaction.created_at.toISOString(),
        updated_at: transaction.updated_at.toISOString(),
        paymentAccount: transaction.paymentAccount ? {
          id: transaction.paymentAccount.id.toString(),
          type: transaction.paymentAccount.type,
          account_identifier: transaction.paymentAccount.account_identifier,
          provider: transaction.paymentAccount.provider,
        } : null,
      };
    });

    return NextResponse.json(transactionsResponse, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}