import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const investmentPlans = await prisma.investmentPlan.findMany({
      where: { is_active: true }
    });

    // Convertir les BigInt en string pour éviter les erreurs de sérialisation
    const serializedPlans = investmentPlans.map(plan => ({
      ...plan,
      id: plan.id.toString(),
      min_amount: plan.min_amount.toString(),
      max_amount: plan.max_amount?.toString() || null,
    }));

    return NextResponse.json(serializedPlans);
  } catch (error) {
    console.error('Error fetching investment plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment plans' },
      { status: 500 }
    );
  }
}