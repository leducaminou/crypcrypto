// app/api/investment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { ITEMS_PER_PAGE } from '@/app/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString())
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    const where: any = {}

    if (status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          plan: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    const [investments, totalCount] = await Promise.all([
      prisma.investment.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          plan: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.investment.count({ where })
    ])

    const formattedInvestments = investments.map(investment => ({
      id: investment.id.toString(),
      userId: investment.user_id.toString(),
      user: {
        first_name: investment.user.first_name,
        last_name: investment.user.last_name,
        email: investment.user.email,
      },
      planId: investment.plan_id.toString(),
      plan: {
        name: investment.plan.name,
      },
      transactionId: investment.transaction_id.toString(),
      amount: investment.amount.toString(),
      expectedProfit: investment.expected_profit.toString(),
      profitEarned: investment.profit_earned.toString(),
      startDate: investment.start_date.toISOString(),
      endDate: investment.end_date.toISOString(),
      status: investment.status,
      createdAt: investment.created_at.toISOString(),
      updatedAt: investment.updated_at.toISOString(),
    }))

    return NextResponse.json({
      investments: formattedInvestments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}