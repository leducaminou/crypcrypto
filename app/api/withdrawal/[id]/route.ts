// app/api/withdrawal/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// Interface pour la réponse API
interface WithdrawalResponse {
  id: string;
  transaction_id: string;
  user_id: string;
  payment_account_id: string | null;
  payment_method: string | null;
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
    type: string;
    status: string;
    amount: string;
    fee: string;
    wallet_address: string | null;
    reference: string;
    details: string | null;
    metadata: any | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  payment_account?: {
    type: string;
    account_identifier: string;
    provider: string;
  } | null;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    joinDate: string;
  };
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
    const resolvedParams = await params;
    const id = resolvedParams.id;
    console.log('Fetching withdrawal with ID:', id); // Log pour debug

    // Valider l'ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de retrait manquant'
        },
        { status: 400 }
      );
    }

    // Vérifier que l'ID est un nombre valide
    let withdrawalId: bigint;
    try {
      withdrawalId = BigInt(id);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de retrait invalide'
        },
        { status: 400 }
      );
    }

    // Récupérer le retrait avec Prisma (includes simplifiés, sans nested inutiles)
    const withdrawal = await prisma.withdrawal.findUnique({
      where: {
        id: withdrawalId
      },
      include: {
        transaction: true,
        paymentAccount: true,
        user: true,
      },
    });

    console.log('Withdrawal found:', !!withdrawal); // Log pour debug

    // Vérifier si le retrait existe
    if (!withdrawal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Retrait non trouvé'
        },
        { status: 404 }
      );
    }

    // Vérifier les données obligatoires
    if (!withdrawal.transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction non trouvée pour ce retrait'
        },
        { status: 404 }
      );
    }
    if (!withdrawal.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Utilisateur non trouvé pour ce retrait'
        },
        { status: 404 }
      );
    }

    // Préparer la réponse
    const withdrawalResponse: WithdrawalResponse = {
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
        fee: withdrawal.transaction.fee ? withdrawal.transaction.fee.toString() : '0',
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
      user: {
        email: withdrawal.user.email,
        firstName: withdrawal.user.first_name,
        lastName: withdrawal.user.last_name,
        phone: withdrawal.user.phone,
        joinDate: withdrawal.user.created_at.toISOString(),
      },
    };
    return NextResponse.json({
      success: true,
      data: withdrawalResponse
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
   
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}