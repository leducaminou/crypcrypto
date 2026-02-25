import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Dates pour les calculs
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Calculer toutes les statistiques en parallèle
    const [
      totalUsers,
      totalUsersLastMonth,
      totalInvestments,
      totalInvestmentsLastMonth,
      monthlyWithdrawals,
      monthlyWithdrawalsLastMonth,
      weeklyNewUsers,
      weeklyNewUsersLastWeek,
      pendingKyc,
      pendingKycLastWeek
    ] = await Promise.all([
      // Utilisateurs totaux
      prisma.user.count(),
      
      // Utilisateurs totaux du mois dernier (pour calculer le changement)
      prisma.user.count({
        where: {
          created_at: {
            lt: startOfMonth
          }
        }
      }),
      
      // Investissements totaux (sum des amounts)
      prisma.investment.aggregate({
        _sum: {
          amount: true
        }
      }),
      
      // Investissements totaux du mois dernier
      prisma.investment.aggregate({
        where: {
          created_at: {
            lt: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Retraits du mois (COMPLETED)
      prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          created_at: {
            gte: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Retraits du mois dernier
      prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          created_at: {
            gte: startOfLastMonth,
            lt: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Nouveaux utilisateurs cette semaine
      prisma.user.count({
        where: {
          created_at: {
            gte: sevenDaysAgo
          }
        }
      }),
      
      // Nouveaux utilisateurs la semaine dernière
      prisma.user.count({
        where: {
          created_at: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo
          }
        }
      }),
      
      // KYC en attente
      prisma.kycVerification.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // KYC en attente la semaine dernière
      prisma.kycVerification.count({
        where: {
          status: 'PENDING',
          created_at: {
            lt: sevenDaysAgo
          }
        }
      })
    ])

    // Calculer les pourcentages de changement
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) {
        return current > 0 ? '+100.0%' : '0.0%'
      }
      const change = ((current - previous) / previous) * 100
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    const calculateChangeAmount = (current: number, previous: number): string => {
      const change = current - previous
      return `${change >= 0 ? '+' : ''}${change}`
    }

    const totalUsersChange = calculateChange(totalUsers, totalUsersLastMonth)
    const totalInvestmentsChange = calculateChange(
      Number(totalInvestments._sum.amount || 0),
      Number(totalInvestmentsLastMonth._sum.amount || 0)
    )
    const monthlyWithdrawalsChange = calculateChange(
      Number(monthlyWithdrawals._sum.amount || 0),
      Number(monthlyWithdrawalsLastMonth._sum.amount || 0)
    )
    const weeklyNewUsersChange = calculateChange(weeklyNewUsers, weeklyNewUsersLastWeek)
    const pendingKycChange = calculateChangeAmount(pendingKyc, pendingKycLastWeek)

    const stats = [
      { 
        title: "Utilisateurs totaux", 
        value: totalUsers.toLocaleString(), 
        change: totalUsersChange, 
        icon: "👥" 
      },
      { 
        title: "Investissements totaux", 
        value: `$${Number(totalInvestments._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        change: totalInvestmentsChange, 
        icon: "📊" 
      },
      { 
        title: "Retraits ce mois", 
        value: `$${Number(monthlyWithdrawals._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        change: monthlyWithdrawalsChange, 
        icon: "💸" 
      },
      { 
        title: "Nouveaux utilisateurs", 
        value: weeklyNewUsers.toString(), 
        change: weeklyNewUsersChange, 
        icon: "🆕" 
      },
      { 
        title: "KYC en attente", 
        value: pendingKyc.toString(), 
        change: pendingKycChange, 
        icon: "🆔" 
      }
    ]

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}