import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// Interface pour la réponse API
interface WalletResponse {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  type: string;
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
    fee: string | null;
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request, 
  { params }: RouteParams
) {
  try {
    // Résoudre les paramètres asynchrones
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Valider l'ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupérer TOUS les portefeuilles de l'utilisateur
    const wallets = await prisma.wallet.findMany({
      where: {
        user_id: BigInt(id),
      },
      select: {
        id: true,
        user_id: true,
        balance: true,
        locked_balance: true,
        type: true,
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
          orderBy: {
            created_at: 'desc'
          },
          take: 10 // Limiter le nombre de transactions pour éviter des réponses trop lourdes
        },
      },
      orderBy: {
        type: 'asc'
      }
    });

    // Vérifier si des portefeuilles existent
    if (!wallets || wallets.length === 0) {
      // Retourner un tableau vide au lieu d'une erreur 404
      return NextResponse.json([], { status: 200 });
    }

    // Convertir les BigInt, Decimal et Date en string pour la sérialisation JSON
    const walletsResponse: WalletResponse[] = wallets.map((wallet) => ({
      id: wallet.id.toString(),
      user_id: wallet.user_id.toString(),
      balance: wallet.balance.toString(),
      locked_balance: wallet.locked_balance.toString(),
      type: wallet.type,
      created_at: wallet.created_at.toISOString(),
      updated_at: wallet.updated_at.toISOString(),
      transactions: wallet.transactions.map((transaction) => {
        try {
          return {
            id: transaction.id.toString(),
            user_id: transaction.user_id.toString(),
            wallet_id: transaction.wallet_id.toString(),
            payment_account_id: transaction.payment_account_id ? transaction.payment_account_id.toString() : null,
            txid: transaction.txid,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount.toString(),
            fee: transaction?.fee ? transaction.fee.toString() : '00.0',
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
          console.error('Error serializing transaction:', error);
          // Retourner une transaction minimaliste en cas d'erreur
          return {
            id: transaction.id.toString(),
            user_id: transaction.user_id.toString(),
            wallet_id: transaction.wallet_id.toString(),
            payment_account_id: null,
            txid: null,
            type: transaction.type,
            status: transaction.status,
            amount: '0',
            fee: '0',
            wallet_address: null,
            reference: null,
            details: 'Error processing transaction data',
            metadata: null,
            processed_at: null,
            created_at: transaction.created_at.toISOString(),
            updated_at: transaction.updated_at.toISOString(),
            payment_account: null,
          };
        }
      }),
    }));

    return NextResponse.json(walletsResponse, { status: 200 });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    // En cas d'erreur, retourner un tableau vide
    return NextResponse.json([], { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}