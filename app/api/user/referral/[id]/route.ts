import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth.config';

// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {

  
  try {


    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const userId = resolvedParams.id

    // Vérifier que l'utilisateur accède à ses propres données
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Convertir l'ID en BigInt
    const userIdBigInt = BigInt(userId);

    // Récupérer les statistiques de parrainage
    const referralStats = await prisma.$transaction(async (tx) => {
      // 1. Nombre total de filleuls
      const totalReferrals = await tx.referral.count({
        where: {
          referred_by: userIdBigInt
        }
      });

      // 2. Nombre de filleuls actifs (avec au moins un dépôt approuvé)
      const activeReferrals = await tx.referral.count({
        where: {
          referred_by: userIdBigInt,
          OR: [
            { first_deposit_at: { not: null } },
            { earnings: { gt: 0 } }
          ]
        }
      });

      // 3. Total des gains de parrainage
      const referralEarnings = await tx.referral.aggregate({
        where: {
          referred_by: userIdBigInt
        },
        _sum: {
          earnings: true
        }
      });

      // 4. Récupérer la devise de l'utilisateur
      const user = await tx.user.findUnique({
        where: { id: userIdBigInt },
        include: {
          country: true
        }
      });

      const totalEarned = referralEarnings._sum.earnings || 0;

      return {
        totalReferrals,
        activeReferrals,
        totalEarned: Number(totalEarned),
      };
    });

    // Formater la réponse
    const formattedStats = {
      totalReferrals: referralStats.totalReferrals,
      activeReferrals: referralStats.activeReferrals,
      totalEarned: `$${referralStats.totalEarned.toFixed(2)}$`,
      rawTotalEarned: referralStats.totalEarned
    };

    return NextResponse.json(formattedStats);

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Erreur lors de la récupération des statistiques de parrainage',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}