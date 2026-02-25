import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const type = searchParams.get('type') as TransactionType | null
    const status = searchParams.get('status') as TransactionStatus | null
    const skip = (page - 1) * limit

    // Construire les conditions de filtrage
    const whereClause: any = {}
    if (type) {
      whereClause.type = type
    }
    if (status) {
      whereClause.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
            id: true
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
            type: true
          }
        }
      }
    })

    // Formater les données pour la réponse
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id.toString(),
      user: transaction.user.email,
      userId: transaction.user.id.toString(),
      userName: `${transaction.user.first_name || ''} ${transaction.user.last_name || ''}`.trim() || transaction.user.email,
      amount: `${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`,
      type: transaction.type,
      date: new Date(transaction.created_at).toLocaleDateString('fr-FR'),
      status: transaction.status,
      rawAmount: Number(transaction.amount),
      createdAt: transaction.created_at,
      method: transaction.paymentAccount?.type || transaction.type,
      paymentAccount: transaction.paymentAccount ? {
        type: transaction.paymentAccount.type,
        account_identifier: transaction.paymentAccount.account_identifier,
        provider: transaction.paymentAccount.provider
      } : undefined,
      walletType: transaction.wallet?.type
    }))

    // Récupérer le total count avec le même filtre
    const totalCount = await prisma.transaction.count({
      where: whereClause
    })

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      userId,
      walletId,
      type,
      amount,
      paymentAccountId,
      reference,
      details,
      metadata
    } = body

    // Validation des données requises
    if (!userId || !walletId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convertir les IDs en BigInt
    const userIdBigInt = BigInt(userId)
    const walletIdBigInt = BigInt(walletId)
    const paymentAccountIdBigInt = paymentAccountId ? BigInt(paymentAccountId) : null

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userIdBigInt }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Vérifier que le wallet existe
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletIdBigInt }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Vérifier le compte de paiement s'il est fourni
    if (paymentAccountIdBigInt) {
      const paymentAccount = await prisma.paymentAccount.findUnique({
        where: { id: paymentAccountIdBigInt }
      })

      if (!paymentAccount) {
        return NextResponse.json(
          { error: 'Payment account not found' },
          { status: 404 }
        )
      }
    }

    // Créer la transaction
    const transaction = await prisma.transaction.create({
      data: {
        reference: reference || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userIdBigInt,
        wallet_id: walletIdBigInt,
        payment_account_id: paymentAccountIdBigInt,
        type: type as TransactionType,
        amount: parseFloat(amount),
        details: details,
        metadata: metadata
      },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true
          }
        },
        paymentAccount: {
          select: {
            type: true,
            account_identifier: true,
            provider: true
          }
        }
      }
    })

    // Formater la réponse
    const formattedTransaction = {
      id: transaction.id.toString(),
      user: transaction.user.email,
      userName: `${transaction.user.first_name || ''} ${transaction.user.last_name || ''}`.trim() || transaction.user.email,
      amount: `${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`,
      type: transaction.type,
      date: new Date(transaction.created_at).toLocaleDateString('fr-FR'),
      status: transaction.status,
      rawAmount: Number(transaction.amount),
      createdAt: transaction.created_at,
      method: transaction.paymentAccount?.type || transaction.type,
      paymentAccount: transaction.paymentAccount ? {
        type: transaction.paymentAccount.type,
        account_identifier: transaction.paymentAccount.account_identifier,
        provider: transaction.paymentAccount.provider
      } : undefined
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      data: formattedTransaction
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating transaction:', error)
    
    if (error instanceof Error) {
      // Vérifier si c'est une erreur Prisma
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Duplicate transaction reference' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}