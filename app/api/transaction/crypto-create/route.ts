import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { generateTransactionReference } from '@/app/lib/utils';

interface TransactionRequest {
  user_id: string;
  wallet_id: string;
  amount: number;
  type?: TransactionType;
  status?: TransactionStatus;
  payment_id?: string;
}

interface TransactionResponse {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  reference: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: Request) {
  try {
    const body: TransactionRequest = await request.json();

    // Validation des données
    if (!body.user_id || isNaN(Number(body.user_id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    if (!body.wallet_id || isNaN(Number(body.wallet_id))) {
      return NextResponse.json(
        { error: 'Invalid wallet ID' },
        { status: 400 }
      );
    }
  
    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur pour vérifier la devise
    const user = await prisma.user.findUnique({
      where: { id: BigInt(body.user_id) },
      include: { country: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Vérifier que le wallet existe et appartient à l'utilisateur
    const wallet = await prisma.wallet.findUnique({
      where: { id: BigInt(body.wallet_id), user_id: BigInt(body.user_id) },
    });
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or does not belong to user' },
        { status: 404 }
      );
    }

  
    // Générer une référence unique
    const reference = generateTransactionReference(body.type || TransactionType.WITHDRAWAL);



    // Créer la transaction
    const transaction = await prisma.transaction.create({
       data: {
        user_id: BigInt(body.user_id),
        wallet_id: BigInt(body.wallet_id),
        amount: body.amount,
        type: body.type || 'DEPOSIT',
        status: body.status || 'PENDING',
        reference,
        payment_id: body.payment_id || null,
      },
      select: {
        id: true,
        user_id: true,
        wallet_id: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Convertir les BigInt et Decimal en string pour la réponse
    const transactionResponse: TransactionResponse = {
      id: transaction.id.toString(),
      user_id: transaction.user_id.toString(),
      wallet_id: transaction.wallet_id.toString(),
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      reference: transaction.reference,
      created_at: transaction.created_at.toISOString(),
      updated_at: transaction.updated_at.toISOString(),
    };

    return NextResponse.json(transactionResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}