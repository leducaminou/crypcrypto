import { NextResponse } from 'next/server';
import { TransactionSchema } from '@/app/lib/validations/TransactionSchema';
import prisma from '@/app/lib/prisma';
import { serializeBigInt } from '@/app/lib/utils';


// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function PUT(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id
    // Validate payment account ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid payment account ID' },
        { status: 400 }
      )
    }
    const body = await request.json();
    
    // Validation
    const validatedData = TransactionSchema.parse(body);

    // Mise à jour de la transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: BigInt(id) },
      data: {
        proof_of_payment: validatedData.proof_of_payment
      }
    });

    return NextResponse.json(serializeBigInt(updatedTransaction), { status: 200 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}