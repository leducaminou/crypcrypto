import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { InvestmentStatus as PrismaInvestmentStatus } from '@prisma/client';
import { CalculateProfitBasedOnDaysService } from '@/app/services/CalculateProfitBasedOnDaysService';
import { InvestmentResponse, InvestmentStatus } from '@/types';

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

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupérer les investissements avec Prisma
    const investments = await prisma.investment.findMany({
      where: { user_id: BigInt(id) },
      select: {
        id: true,
        user_id: true,
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
        transaction: {
          select: {
            id: true,
          },
        },
        amount: true,
        expected_profit: true,
        profit_earned: true,
        start_date: true,
        end_date: true,
        status: true,
        created_at: true,
        updated_at: true,
        profits: {
          select: {
            id: true,
            investment_id: true,
            amount: true,
            profit_date: true,
            is_compounded: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Vérifier si des investissements existent
    if (investments.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Fonction pour convertir le statut Prisma en statut personnalisé
    const convertInvestmentStatus = (status: PrismaInvestmentStatus): InvestmentStatus => {
      switch (status) {
        case 'ACTIVE':
          return InvestmentStatus.ACTIVE;
        case 'COMPLETED':
          return InvestmentStatus.COMPLETED;
        case 'CANCELLED':
          return InvestmentStatus.CANCELLED;
        default:
          return InvestmentStatus.ACTIVE;
      }
    };

    // Convertir les investissements Prisma en format compatible avec notre service
    const investmentResponses: InvestmentResponse[] = investments.map((investment, index) => {
      try {
        // Vérifier les champs potentiellement problématiques
        if (!investment.amount || !investment.expected_profit || !investment.profit_earned) {
          throw new Error(`Invalid data in investment at index ${index}: amount, expected_profit, or profit_earned is null`);
        }
        if (!investment.start_date || !investment.end_date) {
          throw new Error(`Invalid dates in investment at index ${index}`);
        }
        if (!investment.plan) {
          throw new Error(`Plan is null for investment at index ${index}`);
        }
        if (!investment.transaction) {
          throw new Error(`Transaction is null for investment at index ${index}`);
        }

        // Créer l'objet investment de base pour la sérialisation
        const baseInvestment: InvestmentResponse = {
          id: investment.id.toString(),
          user_id: investment.user_id.toString(),
          plan: {
            id: investment.plan.id.toString(),
            name: investment.plan.name || 'Unknown Plan',
          },
          transaction: {
            id: investment.transaction.id.toString(),
          },
          amount: investment.amount.toString(),
          expected_profit: investment.expected_profit.toString(),
          profit_earned: investment.profit_earned.toString(),
          total_profit_calculated: '0.00', // Valeur temporaire
          profits: (investment.profits || []).map((profit) => ({
            id: profit.id.toString(),
            investment_id: profit.investment_id.toString(),
            amount: profit.amount.toString(),
            profit_date: profit.profit_date.toISOString(),
            is_compounded: profit.is_compounded,
          })),
          start_date: investment.start_date.toISOString(),
          end_date: investment.end_date.toISOString(),
          status: convertInvestmentStatus(investment.status),
          created_at: investment.created_at.toISOString(),
          updated_at: investment.updated_at.toISOString(),
        };

        return baseInvestment;
      } catch (error) {
        console.error(`Error serializing investment at index ${index}:`, error);
        throw error;
      }
    });

    // Calculer les profits basés sur les jours écoulés pour tous les investissements
    const profitsMap = CalculateProfitBasedOnDaysService.calculateProfitsForInvestments(investmentResponses);

    // Mettre à jour les investissements avec les profits calculés
    const finalInvestmentResponses = investmentResponses.map(investment => ({
      ...investment,
      total_profit_calculated: profitsMap.get(investment.id) || '0.00'
    }));

    return NextResponse.json(finalInvestmentResponses, { status: 200 });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}