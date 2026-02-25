import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth.config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validation des données requises
    const { user_id, type, account_identifier, provider, crypto_currency, is_default } = body;

    if (!user_id || !type || !account_identifier || !provider) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: BigInt(user_id) },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Si c'est le compte par défaut, désactiver les autres comptes par défaut
    if (is_default) {
      await prisma.paymentAccount.updateMany({
        where: { 
          user_id: BigInt(user_id),
          is_default: true 
        },
        data: { is_default: false },
      });
    }

    // Créer le compte de paiement
    const paymentAccount = await prisma.paymentAccount.create({
      data: {
        user_id: BigInt(user_id),
        type,
        account_identifier,
        provider,
        crypto_currency: type === 'CRYPTO' ? crypto_currency : null,
        network: type === 'CRYPTO' ? null : null, // Peut être défini plus tard
        is_default: is_default || false,
        is_active: true,
      },
    });

    // Convertir BigInt en string pour la réponse
    const response = {
      ...paymentAccount,
      id: paymentAccount.id.toString(),
      user_id: paymentAccount.user_id.toString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating payment account:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}