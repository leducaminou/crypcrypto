import { NextResponse } from 'next/server';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';
import { WithdrawalSchema, WithdrawalSchemaType } from '@/app/lib/validations/WithdrawalSchema';
import prisma from '@/app/lib/prisma';
import { generateTransactionReference } from '@/app/lib/utils';
import { z } from 'zod';

// Interface for the API response
interface WithdrawalResponse {
  id: string;
  transaction_id: string;
  user_id: string;
  payment_account_id: string | null;
  amount: string;
  created_at: string;
  updated_at: string;
  transaction: {
    id: string;
    reference: string;
    amount: string;
    status: TransactionStatus;
  };
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = WithdrawalSchema.parse(body) as WithdrawalSchemaType;

    // Validate user_id
    if (!validatedData.user_id || typeof validatedData.user_id !== 'string') {
      return NextResponse.json(
        { error: 'Valid User ID is required' },
        { status: 400 }
      );
    }

    // Type assertion to ensure TypeScript recognizes user_id as string
    const userId = validatedData.user_id as string;

    // Validate wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { id: BigInt(validatedData.wallet_id) },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Convert amount to Decimal and validate against balance
    const amount = new Prisma.Decimal(validatedData.amount);
    if (amount.greaterThan(wallet.balance)) {
      return NextResponse.json(
        { error: `Solde du portefeuille insuffisant. Montant disponible: ${wallet.balance}$` },
        { status: 400 }
      );
    }

    // Validate KYC status
    const kycVerification = await prisma.kycVerification.findFirst({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });

    if ((!kycVerification || kycVerification.status !== 'APPROVED') && amount.greaterThan(25)) {
      return NextResponse.json(
        { error: 'Limite de 25$ atteinte. Veuillez vérifier votre compte pour augmenter cette limite.' },
        { status: 400 }
      );
    }

    // Generate transaction reference
    const reference = generateTransactionReference(TransactionType.WITHDRAWAL);

    // Create transaction and withdrawal atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          reference,
          user_id: BigInt(userId),
          wallet_id: BigInt(validatedData.wallet_id),
          payment_account_id: validatedData.payment_account_id ? BigInt(validatedData.payment_account_id) : null,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          amount,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: BigInt(validatedData.wallet_id) },
        data: {
          balance: {
            decrement: amount,
          },
          updated_at: new Date(),
        },
      });

      // Create withdrawal
      const withdrawal = await tx.withdrawal.create({
        data: {
          transaction_id: transaction.id,
          user_id: BigInt(userId),
          payment_account_id: validatedData.payment_account_id ? BigInt(validatedData.payment_account_id) : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { transaction, withdrawal };
    });

    // Prepare response with proper serialization
    const response: WithdrawalResponse = {
      id: result.withdrawal.id.toString(),
      transaction_id: result.transaction.id.toString(),
      user_id: result.withdrawal.user_id.toString(),
      payment_account_id: result.withdrawal.payment_account_id?.toString() ?? null,
      amount: result.transaction.amount.toString(),
      created_at: result.withdrawal.created_at.toISOString(),
      updated_at: result.withdrawal.updated_at.toISOString(),
      transaction: {
        id: result.transaction.id.toString(),
        reference: result.transaction.reference,
        amount: result.transaction.amount.toString(),
        status: result.transaction.status,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating withdrawal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}