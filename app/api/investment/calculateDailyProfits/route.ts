import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { InvestmentStatus, WalletType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: Request) {
  // 1. Vérification du secret CRON
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 2. Logique de calcul des profits

    try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Récupérer tous les investissements actifs non expirés
    const activeInvestments = await prisma.investment.findMany({
      where: {
        status: InvestmentStatus.ACTIVE,
        end_date: {
          gt: today
        }
      },
      include: {
        plan: {
          select: {
            id: true,
            daily_profit_percent: true
          }
        },
        user: {
          include: {
            wallet: {
              where: {
                type: WalletType.PROFIT
              }
            }
          }
        },
        profits: {
          where: {
            profit_date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    let totalProfitsCreated = 0;
    const totalUsersAffected = new Set<string>();

    // 2. Traiter chaque investissement
    for (const investment of activeInvestments) {
      // Vérifier si un profit a déjà été créé aujourd'hui
      if (investment.profits.length > 0) {
        continue;
      }

      // Calculer le profit du jour
      const dailyProfit = new Decimal(investment.amount)
        .times(investment.plan.daily_profit_percent)
        .dividedBy(100);

      // Vérifier que l'utilisateur a un portefeuille PROFIT
      if (!investment.user.wallet || investment.user.wallet.length === 0) {
        console.warn(`User ${investment.user_id} has no PROFIT wallet`);
        continue;
      }

      const profitWallet = investment.user.wallet[0];

      // Créer une transaction pour le profit
      const transaction = await prisma.transaction.create({
        data: {
          reference: `PROFIT_${investment.id}_${today.toISOString().split('T')[0]}`,
          user_id: investment.user_id,
          wallet_id: profitWallet.id,
          type: 'DIVIDEND',
          status: 'COMPLETED',
          amount: dailyProfit,
          
          details: `Profit quotidien pour l'investissement ${investment.id}`
        }
      });

      // Créer le profit d'investissement
      await prisma.investmentProfit.create({
        data: {
          investment_id: investment.id,
          transaction_id: transaction.id,
          amount: dailyProfit,
          profit_date: today
        }
      });

      // Mettre à jour le profit total de l'investissement
      const newProfitEarned = new Decimal(investment.profit_earned).plus(dailyProfit);
      await prisma.investment.update({
        where: { id: investment.id },
        data: { profit_earned: newProfitEarned }
      });

      // Mettre à jour le solde du portefeuille PROFIT
      const newBalance = new Decimal(profitWallet.balance).plus(dailyProfit);
      await prisma.wallet.update({
        where: { id: profitWallet.id },
        data: { balance: newBalance }
      });

      totalProfitsCreated++;
      totalUsersAffected.add(investment.user_id.toString());
    }

    return NextResponse.json({
      success: true,
      message: 'Calcul des profits quotidiens terminé',
      data: {
        totalInvestmentsProcessed: activeInvestments.length,
        totalProfitsCreated,
        totalUsersAffected: totalUsersAffected.size
      }
    });

  } catch (error) {
    console.error('Error calculating daily profits:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du calcul des profits' },
      { status: 500 }
    );
  }
}