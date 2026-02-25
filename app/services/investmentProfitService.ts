import { prisma } from '@/app/lib/prisma';

export class InvestmentProfitService {
  /**
   * Calcule le profit total d'un investissement en sommant tous les profits enregistrés
   * @param investmentId - ID de l'investissement
   * @returns Le profit total calculé
   */
  static async calculateTotalProfit(investmentId: bigint): Promise<number> {
    try {
      const profits = await prisma.investmentProfit.findMany({
        where: {
          investment_id: investmentId,
        },
        select: {
          amount: true,
        },
      });

      // Somme de tous les profits
      const totalProfit = profits.reduce((sum, profit) => {
        return sum + Number(profit.amount);
      }, 0);

      return Number(totalProfit.toFixed(2));
    } catch (error) {
      console.error('Error calculating total profit:', error);
      return 0;
    }
  }

  /**
   * Calcule les profits totaux pour plusieurs investissements
   * @param investmentIds - Liste des IDs d'investissements
   * @returns Map avec investmentId -> profit total
   */
  static async calculateTotalProfitsForInvestments(investmentIds: bigint[]): Promise<Map<bigint, number>> {
    try {
      const profits = await prisma.investmentProfit.findMany({
        where: {
          investment_id: {
            in: investmentIds,
          },
        },
        select: {
          investment_id: true,
          amount: true,
        },
      });

      // Grouper les profits par investment_id
      const profitMap = new Map<bigint, number>();
      
      profits.forEach(profit => {
        const currentTotal = profitMap.get(profit.investment_id) || 0;
        profitMap.set(profit.investment_id, currentTotal + Number(profit.amount));
      });

      // S'assurer que tous les investmentIds sont dans la map (même avec profit 0)
      investmentIds.forEach(id => {
        if (!profitMap.has(id)) {
          profitMap.set(id, 0);
        }
      });

      return profitMap;
    } catch (error) {
      console.error('Error calculating total profits for investments:', error);
      return new Map();
    }
  }
}