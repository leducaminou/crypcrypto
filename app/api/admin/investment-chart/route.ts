import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    // Calculer les dates en fonction de la plage
    const now = new Date()
    let startDate: Date

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Récupérer les investissements groupés par date
    const investments = await prisma.investment.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        created_at: true,
        amount: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Grouper les données par jour
    const dailyData: { [key: string]: number } = {}
    
    investments.forEach(investment => {
      const date = new Date(investment.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      
      if (!dailyData[date]) {
        dailyData[date] = 0
      }
      dailyData[date] += Number(investment.amount)
    })

    // Convertir en tableau et formater les données
    const formattedData = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount
    }))

    // Trier par date
    formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Si pas de données, retourner des données vides
    if (formattedData.length === 0) {
      return NextResponse.json([
        { date: 'Aucune donnée', amount: 0 }
      ])
    }

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Error fetching investment chart data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}