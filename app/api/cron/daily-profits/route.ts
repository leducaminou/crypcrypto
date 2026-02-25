import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { generateTransactionReference } from '@/app/lib/utils';
import { TransactionType, TransactionStatus, InvestmentStatus, NotificationType, WalletType } from '@prisma/client';

// Fonction pour valider l'accès au cron
function validateCronAccess(request: NextRequest): boolean {
  // Méthode 1: Vérification du header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Méthode 2: Vérification via query parameter (pour Vercel Cron)
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (secret === process.env.CRON_SECRET) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Valider l'accès au cron job
  if (!validateCronAccess(request)) {
    console.error('🚫 Accès non autorisé au cron job');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Vérifier que le secret est configuré
  if (!process.env.CRON_SECRET) {
    console.error('❌ CRON_SECRET non configuré');
    return NextResponse.json(
      { error: 'Configuration manquante' }, 
      { status: 500 }
    );
  }

  try {
    console.log('🚀 Début du calcul des profits quotidiens...');
    
    // Le reste du code reste identique...
    const activeInvestments = await prisma.investment.findMany({
      where: {
        status: InvestmentStatus.ACTIVE,
      },
      include: {
        user: {
          include: {
            wallet: {
              where: {
                type: WalletType.PROFIT
              }
            }
          }
        },
        plan: true,
      },
    });

    console.log(`📊 ${activeInvestments.length} investissements actifs trouvés`);

    let totalProfits = 0;
    let completedInvestments = 0;

    for (const investment of activeInvestments) {
      try {
        await prisma.$transaction(async (tx) => {
          const today = new Date();
          const dailyProfit = investment.amount.mul(investment.plan.daily_profit_percent).div(100);
          
          let profitWallet = investment.user.wallet[0];
          
          if (!profitWallet) {
            profitWallet = await tx.wallet.create({
              data: {
                user_id: investment.user.id,
                type: WalletType.PROFIT,
                balance: 0,
                locked_balance: 0,
              },
            });
          }

          await tx.wallet.update({
            where: { id: profitWallet.id },
            data: {
              balance: {
                increment: dailyProfit.toNumber(),
              },
            },
          });

          const transaction = await tx.transaction.create({
            data: {
              reference: generateTransactionReference(TransactionType.DIVIDEND),
              user_id: investment.user.id,
              wallet_id: profitWallet.id,
              type: TransactionType.DIVIDEND,
              status: TransactionStatus.COMPLETED,
              amount: dailyProfit,
              details: `Profit quotidien de l'investissement #${investment.id} - Plan: ${investment.plan.name}`,
              processed_at: new Date(),
            },
          });

          await tx.investmentProfit.create({
            data: {
              investment_id: investment.id,
              transaction_id: transaction.id,
              amount: dailyProfit,
              profit_date: today,
              is_compounded: false,
            },
          });

          await tx.investment.update({
            where: { id: investment.id },
            data: {
              profit_earned: {
                increment: dailyProfit.toNumber(),
              },
            },
          });

          await tx.notification.create({
            data: {
              user_id: investment.user.id,
              title: 'Profit Quotidien Reçu',
              message: `Vous avez reçu ${dailyProfit.toNumber().toFixed(2)} € de profit de votre investissement dans le plan ${investment.plan.name}.`,
              type: NotificationType.TRANSACTION,
              metadata: {
                investmentId: investment.id.toString(),
                amount: dailyProfit.toNumber(),
                transactionId: transaction.id.toString(),
                type: 'daily_profit'
              },
            },
          });

          totalProfits += dailyProfit.toNumber();

          if (today >= investment.end_date) {
            await tx.investment.update({
              where: { id: investment.id },
              data: {
                status: InvestmentStatus.COMPLETED,
              },
            });

            await tx.notification.create({
              data: {
                user_id: investment.user.id,
                title: 'Investissement Terminé',
                message: `Votre investissement dans le plan ${investment.plan.name} est maintenant terminé. Profit total gagné: ${investment.profit_earned.add(dailyProfit.toNumber()).toFixed(2)} €.`,
                type: NotificationType.SYSTEM,
                metadata: {
                  investmentId: investment.id.toString(),
                  planName: investment.plan.name,
                  totalProfit: investment.profit_earned.add(dailyProfit.toNumber()).toFixed(2),
                  type: 'investment_completed'
                },
              },
            });

            completedInvestments++;
          }
        });

        console.log(`✅ Investissement #${investment.id} traité avec succès`);

      } catch (error) {
        console.error(`❌ Erreur sur l'investissement #${investment.id}:`, error);
        continue;
      }
    }

    const response = {
      success: true,
      message: 'Calcul des profits quotidiens terminé',
      stats: {
        totalInvestmentsProcessed: activeInvestments.length,
        totalProfitsDistributed: totalProfits,
        investmentsCompleted: completedInvestments,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('✅ Calcul des profits quotidiens terminé avec succès');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur générale du cron job:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du calcul des profits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;