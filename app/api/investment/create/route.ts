// app/api/user/investment/create/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { InvestmentStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';


interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function POST(
  request: Request, 
  { params }: RouteParams
) {


  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const userId = resolvedParams.id

    // const { id: userId } = params;
    const body = await request.json();
    
    // Validation de l'ID utilisateur
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Validation des champs requis
    const { 
      wallet_id,
      payment_account_id,
      plan_id,
      amount
    } = body;

    if (!wallet_id || !plan_id || !amount) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Conversion et validation du montant
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre valide' },
        { status: 400 }
      );
    }

    if (numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être supérieur à zéro' },
        { status: 400 }
      );
    }

    // Récupération et validation du plan d'investissement
    const investmentPlan = await prisma.investmentPlan.findUnique({
      where: { id: BigInt(plan_id) },
    });

    if (!investmentPlan) {
      return NextResponse.json(
        { error: 'Plan d\'investissement non trouvé' },
        { status: 404 }
      );
    }

    if (!investmentPlan.is_active) {
      return NextResponse.json(
        { error: 'Ce plan d\'investissement n\'est pas actif' },
        { status: 400 }
      );
    }

    // Vérification des limites du plan
    const minAmount = Number(investmentPlan.min_amount);
    const maxAmount = investmentPlan.max_amount ? Number(investmentPlan.max_amount) : null;

    if (numericAmount < minAmount) {
      return NextResponse.json(
        { error: `Le montant minimum est ${minAmount}` },
        { status: 400 }
      );
    }

    if (maxAmount && numericAmount > maxAmount) {
      return NextResponse.json(
        { error: `Le montant maximum est ${maxAmount}` },
        { status: 400 }
      );
    }

    // Récupération et validation du portefeuille
    const wallet = await prisma.wallet.findUnique({
      where: { id: BigInt(wallet_id) },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Portefeuille non trouvé' },
        { status: 404 }
      );
    }

    // Vérification du solde
    const walletBalance = Number(wallet.balance);
    if (numericAmount > walletBalance) {
      return NextResponse.json(
        { error: 'Solde insuffisant' },
        { status: 400 }
      );
    }

    // Calcul des valeurs pour l'investissement
    const dailyProfitPercent = Number(investmentPlan.daily_profit_percent);
    const durationDays = investmentPlan.duration_days;
    const expectedProfit = numericAmount * (dailyProfitPercent / 100) * durationDays;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);

    // Création dans une transaction atomique
    const result = await prisma.$transaction(async (prisma) => {
      // Création de la transaction
      const transaction = await prisma.transaction.create({
        data: {
          reference: uuidv4(),
          user_id: BigInt(userId),
          wallet_id: BigInt(wallet_id),
          payment_account_id: payment_account_id ? BigInt(payment_account_id) : null,
          type: TransactionType.INVESTMENT,
          status: TransactionStatus.COMPLETED,
          amount: numericAmount,
          details: `Investissement dans le plan ${investmentPlan.name}`,
        },
      });

      // Création de l'investissement
      const investment = await prisma.investment.create({
        data: {
          user_id: BigInt(userId),
          plan_id: BigInt(plan_id),
          transaction_id: transaction.id,
          amount: numericAmount,
          expected_profit: expectedProfit,
          profit_earned: 0,
          start_date: startDate,
          end_date: endDate,
          status: InvestmentStatus.ACTIVE,
        },
        include: {
          plan: true,
          transaction: true,
        },
      });

      // Mise à jour du solde du portefeuille
      await prisma.wallet.update({
        where: { id: BigInt(wallet_id) },
        data: {
          balance: {
            decrement: numericAmount,
          },
        },
      });

      return {
        investment,
        transaction,
      };
    });

    // Préparation de la réponse
    const response = {
      id: result.investment.id.toString(),
      user_id: result.investment.user_id.toString(),
      plan_id: result.investment.plan_id.toString(),
      transaction_id: result.investment.transaction_id.toString(),
      amount: result.investment.amount.toString(),
      expected_profit: result.investment.expected_profit.toString(),
      profit_earned: result.investment.profit_earned.toString(),
      start_date: result.investment.start_date.toISOString(),
      end_date: result.investment.end_date.toISOString(),
      status: result.investment.status,
      plan: {
        id: result.investment.plan.id.toString(),
        name: result.investment.plan.name,
        min_amount: result.investment.plan.min_amount.toString(),
        max_amount: result.investment.plan.max_amount?.toString() || null,
        daily_profit_percent: result.investment.plan.daily_profit_percent.toString(),
        duration_days: result.investment.plan.duration_days,
      },
      transaction: {
        id: result.investment.transaction.id.toString(),
        reference: result.investment.transaction.reference,
        amount: result.investment.transaction.amount.toString(),
        status: result.investment.transaction.status,
        type: result.investment.transaction.type,
        created_at: result.investment.transaction.created_at.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'investissement:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}