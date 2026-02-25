import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
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
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Validation de l'ID
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Récupération des comptes de paiement
    const paymentAccounts = await prisma.paymentAccount.findMany({
      where: { user_id: BigInt(userId) },
      select: {
        id: true,
        user_id: true,
        type: true,
        account_identifier: true,
        provider: true,
        crypto_currency: true,
        network: true,
        is_default: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        is_default: 'desc',
      },
    });

    // Conversion des BigInt en string pour la sérialisation
    const response = paymentAccounts.map(account => ({
      ...account,
      id: account.id.toString(),
      user_id: account.user_id.toString(),
      created_at: account.created_at.toISOString(),
      updated_at: account.updated_at.toISOString(),
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request, 
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const accountId = resolvedParams.id;

    // Validation de l'ID
    if (!accountId || isNaN(Number(accountId))) {
      return NextResponse.json(
        { error: 'ID de compte invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le compte existe
    const existingAccount = await prisma.paymentAccount.findUnique({
      where: { id: BigInt(accountId) },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Compte de paiement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des transactions associées
    const transactionsCount = await prisma.transaction.count({
      where: { payment_account_id: BigInt(accountId) },
    });

    if (transactionsCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un compte avec des transactions associées' },
        { status: 400 }
      );
    }

    // Vérifier s'il reste d'autres comptes actifs si on supprime le compte par défaut
    if (existingAccount.is_default) {
      const otherActiveAccounts = await prisma.paymentAccount.findMany({
        where: { 
          user_id: existingAccount.user_id,
          id: { not: BigInt(accountId) },
          is_active: true
        },
      });

      if (otherActiveAccounts.length === 0) {
        return NextResponse.json(
          { error: 'Impossible de supprimer le seul compte actif' },
          { status: 400 }
        );
      }

      // Définir un autre compte comme compte par défaut
      await prisma.paymentAccount.update({
        where: { id: otherActiveAccounts[0].id },
        data: { is_default: true },
      });
    }

    // Supprimer le compte
    await prisma.paymentAccount.delete({
      where: { id: BigInt(accountId) },
    });

    return NextResponse.json(
      { message: 'Compte de paiement supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting payment account:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}