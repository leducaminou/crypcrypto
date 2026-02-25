import { InvestmentResponse } from '@/types';
import { InvestmentStatus } from '@prisma/client';

export class CalculateProfitBasedOnDaysService {
  /**
   * Calcule le profit basé sur le nombre de jours écoulés
   * @param investment - L'investissement avec ses données
   * @returns Le profit calculé basé sur les jours écoulés
   */
  static calculateProfitBasedOnDays(investment: InvestmentResponse): string {
    const startDate = new Date(investment.start_date);
    const endDate = new Date(investment.end_date);
    const today = new Date();

    // Calcul de la durée totale en jours
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const totalDurationDays = Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24));

    // Déterminer la date de fin pour le calcul
    const endDateForCalculation = investment.status === InvestmentStatus.ACTIVE ? today : endDate;
    
    // Calcul du nombre de jours écoulés
    const elapsedMs = endDateForCalculation.getTime() - startDate.getTime();
    const elapsedDays = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));

    // S'assurer qu'on ne dépasse pas la durée totale
    const actualElapsedDays = Math.min(elapsedDays, totalDurationDays);

    // Calcul du profit quotidien
    const expectedProfit = parseFloat(investment.expected_profit);
    const dailyProfit = totalDurationDays > 0 ? expectedProfit / totalDurationDays : 0;

    // Calcul du profit actuel basé sur les jours écoulés
    const currentProfit = dailyProfit * actualElapsedDays;

    return currentProfit.toFixed(2);
  }

  /**
   * Calcule les profits basés sur les jours écoulés pour plusieurs investissements
   * @param investments - Liste des investissements
   * @returns Map avec investmentId -> profit calculé
   */
  static calculateProfitsForInvestments(investments: InvestmentResponse[]): Map<string, string> {
    const profitMap = new Map<string, string>();
    
    investments.forEach(investment => {
      const profit = this.calculateProfitBasedOnDays(investment);
      profitMap.set(investment.id, profit);
    });

    return profitMap;
  }
}

// Export de la fonction principale pour une utilisation directe
export const calculateProfitBasedOnDaysService = (investment: InvestmentResponse): string => {
  return CalculateProfitBasedOnDaysService.calculateProfitBasedOnDays(investment);
};