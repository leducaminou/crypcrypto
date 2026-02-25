import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const withdrawals = await prisma.withdrawal.findMany({
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
            last_name: true
          }
        },
        transaction: {
          select: {
            amount: true,
            
            status: true,
            created_at: true,
            paymentAccount: {
              select: {
                type: true,
                account_identifier: true,
                provider: true
              }
            }
          }
        }
      }
    })

    // Formater les données pour la réponse
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id.toString(),
      user: withdrawal.user.email,
      userName: `${withdrawal.user.first_name || ''} ${withdrawal.user.last_name || ''}`.trim() || withdrawal.user.email,
      amount: `${Number(withdrawal.transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`,
      method: withdrawal.transaction.paymentAccount?.type || 'Inconnu',
      date: new Date(withdrawal.created_at).toLocaleDateString('fr-FR'),
      status: withdrawal.transaction.status.toLowerCase(),
      rawAmount: Number(withdrawal.transaction.amount),
      
      createdAt: withdrawal.created_at
    }))

    // Récupérer le total count pour la pagination
    const totalCount = await prisma.withdrawal.count()

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}