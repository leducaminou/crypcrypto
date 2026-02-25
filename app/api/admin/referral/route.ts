import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { ReferralStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as ReferralStatus | 'all' | null;

    const skip = (page - 1) * limit;

    // Filtre where optionnel
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Récupérer les referrals avec relations
    const referrals = await prisma.referral.findMany({
      skip,
      take: limit,
      where,
      include: {
        referrer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        referee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transformer les données
    const referralsWithDetails = referrals.map((referral) => ({
      id: referral.id.toString(),
      referred_by: referral.referred_by.toString(),
      user_id: referral.user_id.toString(),
      referrer_name: `${referral.referrer.first_name || ''} ${referral.referrer.last_name || ''}`.trim() || referral.referrer.email,
      referrer_email: referral.referrer.email,
      referee_name: `${referral.referee.first_name || ''} ${referral.referee.last_name || ''}`.trim() || referral.referee.email,
      referee_email: referral.referee.email,
      earnings: parseFloat(referral.earnings.toString()),
      status: referral.status,
      signed_up_at: referral.signed_up_at.toISOString(),
      first_deposit_at: referral.first_deposit_at?.toISOString() || null,
      last_earning_at: referral.last_earning_at?.toISOString() || null,
      created_at: referral.created_at.toISOString(),
      updated_at: referral.updated_at.toISOString(),
    }));

    // Compter le total
    const total = await prisma.referral.count({ where });

    return NextResponse.json({
      referrals: referralsWithDetails,
      total,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}