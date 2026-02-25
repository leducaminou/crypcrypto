import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// Interface pour la réponse API (avec BigInt et Decimal convertis en string)
interface WalletResponse {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  created_at: string;
  updated_at: string;
  transactions: {
    id: string;
    user_id: string;
    wallet_id: string;
    payment_account_id: string | null;
    txid: string | null;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    
    wallet_address: string | null;
    reference: string | null;
    details: string | null;
    metadata: any | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    payment_account?: {
      type: PaymentMethod;
      account_identifier: string;
      provider: string;
    } | null;
  }[];
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
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupérer le portefeuille avec Prisma, incluant les transactions associées
    const wallet = await prisma.wallet.findFirst({
      where: {
         user_id: BigInt(id),
         type: 'BONUS'
        },
      select: {
        id: true,
        user_id: true,
        balance: true,
        locked_balance: true,
        created_at: true,
        updated_at: true,
        transactions: {
          select: {
            id: true,
            user_id: true,
            wallet_id: true,
            payment_account_id: true,
            txid: true,
            type: true,
            status: true,
            amount: true,
            fee: true,
            
            wallet_address: true,
            reference: true,
            details: true,
            metadata: true,
            processed_at: true,
            created_at: true,
            updated_at: true,
            paymentAccount: {
              select: {
                type: true,
                account_identifier: true,
                provider: true,
              },
            },
          },
        },
      },
    });

    // Vérifier si le portefeuille existe
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Convertir les BigInt, Decimal et Date en string pour la sérialisation JSON
    const walletResponse: WalletResponse = {
      id: wallet.id.toString(),
      user_id: wallet.user_id.toString(),
      balance: wallet.balance.toString(),
      locked_balance: wallet.locked_balance.toString(),
      created_at: wallet.created_at.toISOString(),
      updated_at: wallet.updated_at.toISOString(),
      transactions: wallet.transactions.map((transaction, index) => {
        try {
          // Vérifier les champs potentiellement problématiques
          if (!transaction.amount || !transaction.fee) {
            throw new Error(`Invalid data in transaction at index ${index}: amount or fee is null`);
          }
          if (!transaction.created_at || !transaction.updated_at) {
            throw new Error(`Invalid dates in transaction at index ${index}`);
          }

          return {
            id: transaction.id.toString(),
            user_id: transaction.user_id.toString(),
            wallet_id: transaction.wallet_id.toString(),
            payment_account_id: transaction.payment_account_id ? transaction.payment_account_id.toString() : null,
            txid: transaction.txid,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount.toString(),
            fee: transaction.fee.toString(),
            
            wallet_address: transaction.wallet_address,
            reference: transaction.reference,
            details: transaction.details,
            metadata: transaction.metadata,
            processed_at: transaction.processed_at ? transaction.processed_at.toISOString() : null,
            created_at: transaction.created_at.toISOString(),
            updated_at: transaction.updated_at.toISOString(),
            payment_account: transaction.paymentAccount ? {
              type: transaction.paymentAccount.type,
              account_identifier: transaction.paymentAccount.account_identifier,
              provider: transaction.paymentAccount.provider,
            } : null,
          };
        } catch (error) {
          console.error(`Error serializing transaction at index ${index}:`, error);
          throw error;
        }
      }),
    };

    return NextResponse.json(walletResponse, { status: 200 });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}