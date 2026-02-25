import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { TransactionType, TransactionStatus, InvestmentStatus } from '@prisma/client';
import { calculateProfit } from '@/app/lib/utils';
import { generateTransactionReference } from '@/app/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request, 
  { params }: RouteParams
) {
  try {
    // Résoudre les paramètres asynchrones
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Validation de l'ID utilisateur
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Parse du body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { 
      wallet_id, 
      plan_id, 
      amount 
    } = body;

    // Validation des données requises
    if (!wallet_id || !plan_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_id, plan_id, amount' },
        { status: 400 }
      );
    }

    // Validation des types
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    // Récupérer le plan d'investissement
    const investmentPlan = await prisma.investmentPlan.findUnique({
      where: { id: BigInt(plan_id) },
    });

    if (!investmentPlan) {
      return NextResponse.json(
        { error: 'Investment plan not found' },
        { status: 404 }
      );
    }

    // Vérifier si le plan est actif
    if (!investmentPlan.is_active) {
      return NextResponse.json(
        { error: 'Investment plan is not active' },
        { status: 400 }
      );
    }

    // Vérifier le wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: BigInt(wallet_id) },
      select: {
        id: true,
        balance: true,
        user_id: true,
        type: true
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Vérifier que le wallet appartient à l'utilisateur
    if (wallet.user_id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Wallet does not belong to user' },
        { status: 403 }
      );
    }

    // Vérifier le solde du wallet
    if (Number(wallet.balance) < amountNum) {
      return NextResponse.json(
        { error: 'Solde du compte insuffisant' },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan
    const minAmount = Number(investmentPlan.min_amount);
    const maxAmount = investmentPlan.max_amount ? Number(investmentPlan.max_amount) : Infinity;

    if (amountNum < minAmount) {
      return NextResponse.json(
        { error: `Montant en dessous du minimum requis (${minAmount})$` },
        { status: 400 }
      );
    }

    if (amountNum > maxAmount) {
      return NextResponse.json(
        { error: `Montant au dessus maximum autorisé (${maxAmount})$` },
        { status: 400 }
      );
    }

    // Calculer les dates et le profit attendu
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + investmentPlan.duration_days);

    const expectedProfit = calculateProfit(
      amountNum,
      investmentPlan.duration_days,
      Number(investmentPlan.daily_profit_percent)
    );

    // Utiliser une transaction pour garantir l'intégrité des données
    const result = await prisma.$transaction(async (tx) => {
      // Créer la transaction
      const transaction = await tx.transaction.create({
        data: {
          reference: generateTransactionReference(TransactionType.INVESTMENT),
          user_id: BigInt(userId),
          wallet_id: BigInt(wallet_id),
          type: TransactionType.INVESTMENT,
          status: TransactionStatus.COMPLETED,
          amount: amountNum,
          details: `Investissemet du plan ${investmentPlan.name}, compte de ${wallet.type === 'DEPOSIT' ? "dépot" : "profit"} wallet`,
          metadata: {
            wallet_type: wallet.type,
            plan_name: investmentPlan.name,
          }
        },
      });

      // Mettre à jour le solde du wallet (déduire le montant)
      await tx.wallet.update({
        where: { id: BigInt(wallet_id) },
        data: {
          balance: {
            decrement: amountNum
          }
        }
      });

      // Créer l'investissement
      const investment = await tx.investment.create({
        data: {
          user_id: BigInt(userId),
          plan_id: BigInt(plan_id),
          transaction_id: transaction.id,
          amount: amountNum,
          expected_profit: expectedProfit,
          start_date: startDate,
          end_date: endDate,
          status: InvestmentStatus.ACTIVE,
        },
      });

      return { investment, transaction };
    });

    // Convertir les BigInt en string pour la réponse
    const response = {
      ...result.investment,
      id: result.investment.id.toString(),
      user_id: result.investment.user_id.toString(),
      plan_id: result.investment.plan_id.toString(),
      transaction_id: result.investment.transaction_id.toString(),
      amount: result.investment.amount.toString(),
      expected_profit: result.investment.expected_profit.toString(),
      profit_earned: result.investment.profit_earned.toString(),
      start_date: result.investment.start_date.toISOString(),
      end_date: result.investment.end_date.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}