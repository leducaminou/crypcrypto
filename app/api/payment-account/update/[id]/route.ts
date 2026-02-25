import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth.config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
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

    const body = await request.json();
    const { type, account_identifier, provider, crypto_currency, is_default } = body;

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

    // Si c'est le compte par défaut, désactiver les autres comptes par défaut
    if (is_default) {
      await prisma.paymentAccount.updateMany({
        where: { 
          user_id: existingAccount.user_id,
          is_default: true,
          id: { not: BigInt(accountId) }
        },
        data: { is_default: false },
      });
    }

    // Mettre à jour le compte
    const updatedAccount = await prisma.paymentAccount.update({
      where: { id: BigInt(accountId) },
      data: {
        type,
        account_identifier,
        provider,
        crypto_currency: type === 'CRYPTO' ? crypto_currency : null,
        network: type === 'CRYPTO' ? null : null,
        is_default: is_default || false,
      },
    });

    // Convertir BigInt en string pour la réponse
    const response = {
      ...updatedAccount,
      id: updatedAccount.id.toString(),
      user_id: updatedAccount.user_id.toString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating payment account:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}