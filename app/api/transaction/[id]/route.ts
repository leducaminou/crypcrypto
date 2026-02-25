// app/api/transaction/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'


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
    const transactionId = resolvedParams.id
    // Validate payment account ID
    if (!transactionId || isNaN(Number(transactionId))) {
      return NextResponse.json(
        { error: 'Invalid payment account ID' },
        { status: 400 }
      )
    }
    

    // Convertir l'ID en BigInt
    const transactionIdBigInt = BigInt(transactionId)

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionIdBigInt
      },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            created_at: true
          }
        },
        paymentAccount: {
          select: {
            type: true,
            account_identifier: true,
            provider: true
          }
        },
        wallet: {
          select: {
            type: true,
            balance: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    // Formater les données pour la réponse
    const formattedTransaction = {
      id: transaction.id.toString(),
      reference: transaction.reference,
      type: transaction.type,
      payment_id: transaction.payment_id,
      crypto_currency: transaction.crypto_currency,
      pay_amount: transaction.pay_amount ? Number(transaction.pay_amount) : null,
      pay_address: transaction.pay_address,
      actually_paid: transaction.actually_paid ? Number(transaction.actually_paid) : null,
      user: {
        email: transaction.user.email,
        firstName: transaction.user.first_name,
        lastName: transaction.user.last_name,
        phone: transaction.user.phone,
        joinDate: transaction.user.created_at
      },
      amount: Number(transaction.amount),
      status: transaction.status,
      method: transaction.paymentAccount?.type || transaction.type,
      paymentAccount: transaction.paymentAccount ? {
        type: transaction.paymentAccount.type,
        account_identifier: transaction.paymentAccount.account_identifier,
        provider: transaction.paymentAccount.provider
      } : null,
      walletType: transaction.wallet?.type,
      walletBalance: transaction.wallet ? Number(transaction.wallet.balance) : null,
      fee: transaction.fee ? Number(transaction.fee) : 0,
      details: transaction.details,
      proofOfPayment: transaction.proof_of_payment,
      createdAt: transaction.created_at,
      processedAt: transaction.processed_at,
      metadata: transaction.metadata
    }

    return NextResponse.json({
      success: true,
      data: formattedTransaction
    })

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}