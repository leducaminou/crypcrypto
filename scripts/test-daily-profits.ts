import { prisma } from '@/app/lib/prisma';
import { generateTransactionReference } from '@/app/lib/utils';
import { TransactionType, TransactionStatus, InvestmentStatus, NotificationType, WalletType } from '@prisma/client';

async function testDailyProfits() {
  console.log('🧪 Début du test local du calcul des profits quotidiens...');

  try {
    // Récupérer tous les investissements actifs avec les relations nécessaires
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

    // Traiter chaque investissement
    for (const investment of activeInvestments) {
      try {
        await prisma.$transaction(async (tx) => {
          const today = new Date();
          
          // 1. Calculer le profit quotidien
          const dailyProfit = investment.amount.mul(investment.plan.daily_profit_percent).div(100);
          
          console.log(`💰 Investissement #${investment.id}: ${dailyProfit.toNumber().toFixed(2)} € de profit`);

          // Vérifier si le wallet PROFIT existe, sinon le créer
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
            console.log(`🆕 Wallet PROFIT créé pour l'utilisateur ${investment.user.id}`);
          }

          // 2. Mettre à jour le wallet PROFIT
          const updatedWallet = await tx.wallet.update({
            where: { id: profitWallet.id },
            data: {
              balance: {
                increment: dailyProfit.toNumber(),
              },
            },
          });

          console.log(`💳 Wallet ${profitWallet.id} mis à jour: ${profitWallet.balance.toNumber().toFixed(2)} € → ${updatedWallet.balance.toNumber().toFixed(2)} €`);

          // 3. Créer la transaction DIVIDEND
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

          console.log(`📝 Transaction créée: ${transaction.reference}`);

          // 4. Créer l'enregistrement InvestmentProfit
          await tx.investmentProfit.create({
            data: {
              investment_id: investment.id,
              transaction_id: transaction.id,
              amount: dailyProfit,
              profit_date: today,
              is_compounded: false,
            },
          });

          // 5. Mettre à jour le profit total gagné dans l'investissement
          const updatedInvestment = await tx.investment.update({
            where: { id: investment.id },
            data: {
              profit_earned: {
                increment: dailyProfit.toNumber(),
              },
            },
          });

          console.log(`📈 Investissement #${investment.id} - Profit total: ${updatedInvestment.profit_earned.toNumber().toFixed(2)} €`);

          // 6. Créer la notification pour le profit
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

          // 7. Vérifier si l'investissement est expiré
          if (today >= investment.end_date) {
            await tx.investment.update({
              where: { id: investment.id },
              data: {
                status: InvestmentStatus.COMPLETED,
              },
            });

            // Créer une notification pour l'expiration
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
            console.log(`🏁 Investissement #${investment.id} marqué comme COMPLETED`);
          }
        });

        console.log(`✅ Investissement #${investment.id} traité avec succès`);

      } catch (error) {
        console.error(`❌ Erreur sur l'investissement #${investment.id}:`, error);
        continue;
      }
    }

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS!');
    console.log('📊 STATISTIQUES:');
    console.log(`   • Investissements traités: ${activeInvestments.length}`);
    console.log(`   • Profits distribués: ${totalProfits.toFixed(2)} €`);
    console.log(`   • Investissements terminés: ${completedInvestments}`);

  } catch (error) {
    console.error('❌ Erreur générale du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testDailyProfits();