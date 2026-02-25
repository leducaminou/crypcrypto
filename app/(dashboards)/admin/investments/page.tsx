// app/(dashboards)/admin/investments/page.tsx
import prisma from '@/app/lib/prisma';
import { Investment, InvestmentPlan } from '@/types';
import AdminInvestmentsClient from './AdminInvestmentsClient';
import { ITEMS_PER_PAGE } from '@/app/lib/constants';

async function fetchInvestments(page: number = 1, limit: number = ITEMS_PER_PAGE): Promise<{
  investments: Investment[];
  totalCount: number;
}> {
  try {
    const skip = (page - 1) * limit;

    const [investments, totalCount] = await Promise.all([
      prisma.investment.findMany({
        skip,
        take: limit,
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
      prisma.investment.count()
    ]);

    const formattedInvestments = investments.map((inv) => ({
      id: inv.id.toString(),
      userId: inv.user_id.toString(),
      user: {
        first_name: inv.user.first_name,
        last_name: inv.user.last_name,
        email: inv.user.email,
      },
      planId: inv.plan_id.toString(),
      plan: {
        name: inv.plan.name,
      },
      transactionId: inv.transaction_id.toString(),
      amount: inv.amount.toString(),
      expectedProfit: inv.expected_profit.toString(),
      profitEarned: inv.profit_earned.toString(),
      startDate: inv.start_date.toISOString(),
      endDate: inv.end_date.toISOString(),
      status: inv.status,
      createdAt: inv.created_at.toISOString(),
      updatedAt: inv.updated_at.toISOString(),
    }));

    return {
      investments: formattedInvestments,
      totalCount
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des investissements:', error);
    return {
      investments: [],
      totalCount: 0
    };
  }
}

async function fetchInvestmentPlans(): Promise<InvestmentPlan[]> {
  try {
    const plans = await prisma.investmentPlan.findMany();

    return plans.map((plan) => ({
      id: plan.id.toString(),
      name: plan.name,
      description: plan.description,
      minAmount: Number(plan.min_amount), // Convertir en number
      maxAmount: plan.max_amount ? Number(plan.max_amount) : null, // Convertir en number ou null
      dailyProfitPercent: Number(plan.daily_profit_percent), // Convertir en number
      durationDays: plan.duration_days,
      isActive: plan.is_active,
      withdrawalLockDays: plan.withdrawal_lock_days,
      capitalReturn: plan.capital_return,
      createdAt: plan.created_at.toISOString(),
      updatedAt: plan.updated_at.toISOString(),
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des plans:', error);
    return [];
  }
}

async function fetchStats() {
  try {
    const [
      activeInvestmentsSum,
      totalProfit,
      completedInvestmentsCount,
      activePlansCount,
      activeInvestmentsCount
    ] = await Promise.all([
      // Somme des investissements actifs
      prisma.investment.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      // Somme de tous les profits d'investissement
      prisma.investmentProfit.aggregate({
        _sum: { amount: true },
      }),
      // Nombre d'investissements terminés
      prisma.investment.count({
        where: { status: 'COMPLETED' },
      }),
      // Nombre de plans actifs
      prisma.investmentPlan.count({
        where: { is_active: true },
      }),
      // Nombre d'investissements actifs
      prisma.investment.count({
        where: { status: 'ACTIVE' },
      })
    ]);

    return [
      {
        title: 'Investissements actifs',
        value: `$${Number(activeInvestmentsSum._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `+${activeInvestmentsCount}`,
        icon: '💼',
      },
      {
        title: 'Profit généré',
        value: `$${Number(totalProfit._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: '+8.2%',
        icon: '💰',
      },
      {
        title: 'Investissements terminés',
        value: completedInvestmentsCount.toString(),
        change: '+3',
        icon: '✅',
      },
      {
        title: 'Plans actifs',
        value: activePlansCount.toString(),
        change: '+0%',
        icon: '📋',
      },
    ];
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return [
      { title: 'Investissements actifs', value: '$0.00', change: '+0%', icon: '💼' },
      { title: 'Profit généré', value: '$0.00', change: '+0%', icon: '💰' },
      { title: 'Investissements terminés', value: '0', change: '+0', icon: '✅' },
      { title: 'Plans actifs', value: '0', change: '+0%', icon: '📋' },
    ];
  }
}

export default async function AdminInvestmentsPage() {
  const [investmentsData, plans, stats] = await Promise.all([
    fetchInvestments(),
    fetchInvestmentPlans(),
    fetchStats(),
  ]);

  return (
    <AdminInvestmentsClient
      initialInvestments={investmentsData.investments}
      initialPlans={plans}
      initialStats={stats}
      initialTotalCount={investmentsData.totalCount}
    />
  );
}