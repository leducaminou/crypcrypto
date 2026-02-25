import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { ReferralStatus } from '@prisma/client';

// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {


  try {
    
    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid referral ID' },
        { status: 400 }
      );
    }

    // Récupérer le referral avec relations détaillées
    const referral = await prisma.referral.findUnique({
      where: { id: BigInt(id) },
      include: {
        referrer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
        referee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            country: {
              select: {
                name: true,
              },
            },
          },
        },
        bonuses: {
          include: {
            transaction: {
              select: {
                id: true,
                amount: true,
                type: true,
                status: true,
                created_at: true,
                reference: true,
              },
            },
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // Transformer les données
    const referralDetails = {
      id: referral.id.toString(),
      referred_by: referral.referred_by.toString(),
      user_id: referral.user_id.toString(),
      referrer: {
        name: `${referral.referrer.first_name || ''} ${referral.referrer.last_name || ''}`.trim() || referral.referrer.email,
        email: referral.referrer.email,
        phone: referral.referrer.phone || 'Non renseigné',
        country: referral.referrer.country?.name || 'Non renseigné',
      },
      referee: {
        name: `${referral.referee.first_name || ''} ${referral.referee.last_name || ''}`.trim() || referral.referee.email,
        email: referral.referee.email,
        phone: referral.referee.phone || 'Non renseigné',
        country: referral.referee.country?.name || 'Non renseigné',
      },
      earnings: parseFloat(referral.earnings.toString()),
      status: referral.status,
      signed_up_at: referral.signed_up_at.toISOString(),
      first_deposit_at: referral.first_deposit_at?.toISOString() || null,
      last_earning_at: referral.last_earning_at?.toISOString() || null,
      created_at: referral.created_at.toISOString(),
      updated_at: referral.updated_at.toISOString(),
      bonuses: referral.bonuses.map((bonus) => ({
        id: bonus.id.toString(),
        amount: parseFloat(bonus.amount.toString()),
        description: bonus.description || 'N/A',
        created_at: bonus.created_at.toISOString(),
        transaction: {
          id: bonus.transaction.id.toString(),
          amount: parseFloat(bonus.transaction.amount.toString()),
          type: bonus.transaction.type,
          status: bonus.transaction.status,
          created_at: bonus.transaction.created_at.toISOString(),
          reference: bonus.transaction.reference || 'N/A',
        },
      })),
    };


    return NextResponse.json({
      referral: referralDetails,
    });

  } catch (error) {
    console.error('Error fetching referral details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}