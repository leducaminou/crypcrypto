
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// Interface pour la réponse API (avec BigInt et Decimal convertis en string)
interface WithdrawalResponse {
  id: string;
  transaction_id: string;
  user_id: string;
  payment_account_id: string | null;
  payment_method: PaymentMethod | null; // From PaymentAccount.type
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  transaction: {
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
  };
  payment_account?: {
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
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupérer les retraits avec Prisma, incluant les informations de la transaction et du compte de paiement associés
    const withdrawals = await prisma.withdrawal.findMany({
      where: { user_id: BigInt(id) },
      select: {
        id: true,
        transaction_id: true,
        user_id: true,
        payment_account_id: true,
        rejection_reason: true,
        approved_by: true,
        approved_at: true,
        created_at: true,
        updated_at: true,
        transaction: {
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
          },
        },
        paymentAccount: {
          select: {
            id: true,
            type: true,
            account_identifier: true,
            provider: true,
            is_default: true,
          },
        },
      },
      orderBy: {
          created_at: 'desc',
        },
    });

    // Vérifier si des retraits existent
    if (withdrawals.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawals not found' },
        { status: 404 }
      );
    }

    // Convertir les BigInt, Decimal et Date en string pour la sérialisation JSON
    const withdrawalResponse: WithdrawalResponse[] = withdrawals.map((withdrawal, index) => {
      try {
        // Vérifier les champs potentiellement problématiques
        if (!withdrawal.transaction?.amount || !withdrawal.transaction?.fee) {
          throw new Error(`Invalid data in transaction for withdrawal at index ${index}: amount or fee is null`);
        }
        if (!withdrawal.created_at || !withdrawal.updated_at || !withdrawal.transaction?.created_at || !withdrawal.transaction?.updated_at) {
          throw new Error(`Invalid dates in withdrawal or transaction at index ${index}`);
        }

        return {
          id: withdrawal.id.toString(),
          transaction_id: withdrawal.transaction_id.toString(),
          user_id: withdrawal.user_id.toString(),
          payment_account_id: withdrawal.payment_account_id ? withdrawal.payment_account_id.toString() : null,
          payment_method: withdrawal.paymentAccount ? withdrawal.paymentAccount.type : null,
          rejection_reason: withdrawal.rejection_reason,
          approved_by: withdrawal.approved_by ? withdrawal.approved_by.toString() : null,
          approved_at: withdrawal.approved_at ? withdrawal.approved_at.toISOString() : null,
          created_at: withdrawal.created_at.toISOString(),
          updated_at: withdrawal.updated_at.toISOString(),
          transaction: {
            id: withdrawal.transaction.id.toString(),
            user_id: withdrawal.transaction.user_id.toString(),
            wallet_id: withdrawal.transaction.wallet_id.toString(),
            payment_account_id: withdrawal.transaction.payment_account_id ? withdrawal.transaction.payment_account_id.toString() : null,
            txid: withdrawal.transaction.txid,
            type: withdrawal.transaction.type,
            status: withdrawal.transaction.status,
            amount: withdrawal.transaction.amount.toString(),
            fee: withdrawal.transaction.fee.toString(),
            
            wallet_address: withdrawal.transaction.wallet_address,
            reference: withdrawal.transaction.reference,
            details: withdrawal.transaction.details,
            metadata: withdrawal.transaction.metadata,
            processed_at: withdrawal.transaction.processed_at ? withdrawal.transaction.processed_at.toISOString() : null,
            created_at: withdrawal.transaction.created_at.toISOString(),
            updated_at: withdrawal.transaction.updated_at.toISOString(),
          },
          payment_account: withdrawal.paymentAccount ? {
            type: withdrawal.paymentAccount.type,
            account_identifier: withdrawal.paymentAccount.account_identifier,
            provider: withdrawal.paymentAccount.provider,
          } : null,
        };
      } catch (error) {
        console.error(`Error serializing withdrawal at index ${index}:`, error);
        throw error;
      }
    });

    return NextResponse.json(withdrawalResponse, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}