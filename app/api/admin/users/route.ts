import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Récupérer tous les utilisateurs avec les relations nécessaires
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      skip,
      take: limit,
      include: {
        country: true,
        investments: {
          include: {
            profits: true,
          },
        },
        wallet: {
          where: {
            type: {
              in: ['DEPOSIT', 'PROFIT'],
            },
          },
        },
        referralsAsReferrer: {
          include: {
            referee: {
              include: {
                investments: {
                  include: {
                    profits: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Récupérer tous les parrains pour les noms
    const referrerIds = users.map(user => user.referred_by).filter(Boolean) as bigint[];
    const referrers = await prisma.user.findMany({
      where: {
        id: {
          in: referrerIds.length > 0 ? referrerIds : undefined,
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    // Transformer les données avec les aggregations
    const usersWithStats = users.map((user) => {
      // Calcul des investissements
      const investment = user.investments.reduce(
        (sum, inv) => sum + parseFloat(inv.amount.toString()),
        0
      );

      // Calcul des profits
      const profit = user.investments.reduce(
        (sum, inv) => sum + parseFloat(inv.profit_earned.toString()),
        0
      );

      // Calcul des wallets
      const depositWallet = user.wallet.find(w => w.type === 'DEPOSIT');
      const profitWallet = user.wallet.find(w => w.type === 'PROFIT');
      
      const Wallet_1 = depositWallet ? parseFloat(depositWallet.balance.toString()) : 0;
      const Wallet_2 = profitWallet ? parseFloat(profitWallet.balance.toString()) : 0;
      const balance = Wallet_1 + Wallet_2;

      // Calcul des parrainages
      const referree = user.referralsAsReferrer.length;

      // Calcul des profits des parrainés
      const referree_profit = user.referralsAsReferrer.reduce((sum, referral) => {
        const refereeProfit = referral.referee.investments.reduce(
          (profitSum, inv) => profitSum + parseFloat(inv.profit_earned.toString()),
          0
        );
        return sum + refereeProfit;
      }, 0);

      // Trouver le nom du parrain
      let referred_by_name = null;
      if (user.referred_by) {
        const referrer = referrers.find(r => r.id.toString() === user.referred_by?.toString());
        if (referrer) {
          referred_by_name = `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim();
        }
      }

      return {
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        is_email_verified: user.is_email_verified,
        email_verified_at: user.email_verified_at?.toISOString(),
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        last_login_at: user.last_login_at?.toISOString(),
        last_login_ip: user.last_login_ip,
        is_active: user.is_active,
        is_locked: user.is_locked,
        referral_code: user.referral_code,
        referred_by: user.referred_by?.toString(),
        country: user.country ? {
          name: user.country.name,
          dial_code: user.country.dial_code,
          country_code: user.country.country_code,
        } : null,
        referred_by_name,
        investment,
        profit,
        Wallet_1,
        Wallet_2,
        balance,
        referree,
        referree_profit,
      };
    });

    // Compter le total des utilisateurs
    const total = await prisma.user.count();

    return NextResponse.json({
      users: usersWithStats,
      total,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}