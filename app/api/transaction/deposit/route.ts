import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth.config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { 
      amount, 
      crypto_currency, 
      payment_id, 
      pay_amount, 
      pay_address, 
      network, 
      smart_contract 
    } = await request.json();

    // Validation des données requises
    if (!amount || !crypto_currency || !payment_id) {
      return NextResponse.json(
        { error: 'Données manquantes: amount, crypto_currency et payment_id sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      include: {
        wallet: {
          where: { type: 'DEPOSIT' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Trouver ou créer le wallet DEPOSIT
    let depositWallet = user.wallet[0];
    
    if (!depositWallet) {
      depositWallet = await prisma.wallet.create({
        data: {
          user_id: BigInt(session.user.id),
          type: 'DEPOSIT',
          balance: 0,
          locked_balance: 0
        }
      });
    }

    // Vérifier si une transaction avec ce payment_id existe déjà
    const existingTransaction = await prisma.transaction.findFirst({
      where: { 
        payment_id: payment_id.toString(),
        type: 'DEPOSIT'
      }
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Une transaction avec ce payment_id existe déjà' },
        { status: 409 }
      );
    }

    // Générer une référence unique
    const reference = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer la transaction avec statut PENDING
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        payment_id: payment_id.toString(),
        user_id: BigInt(session.user.id),
        wallet_id: depositWallet.id,
        type: 'DEPOSIT',
        status: 'PENDING', // Statut en attente dès la création
        amount: parseFloat(amount.toString()),
        crypto_currency: crypto_currency.toUpperCase(),
        pay_amount: pay_amount ? parseFloat(pay_amount.toString()) : null,
        pay_address,
        network,
        smart_contract,
        metadata: {
          created_at: new Date().toISOString(),
          source: 'nowpayments',
          user_agent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          transaction_phase: 'initialized' // Phase d'initialisation
        }
      },
      include: {
        wallet: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Créer une notification pour informer l'utilisateur
    await prisma.notification.create({
      data: {
        user_id: BigInt(session.user.id),
        title: 'Dépôt en attente',
        message: `Votre dépôt de ${amount} USD en ${crypto_currency.toUpperCase()} a été initialisé. En attente de confirmation.`,
        type: 'TRANSACTION',
        metadata: {
          transaction_id: transaction.id.toString(),
          amount: amount,
          currency: 'USD',
          crypto_currency: crypto_currency,
          type: 'DEPOSIT',
          status: 'PENDING'
        }
      }
    });

    console.log(`Transaction créée avec succès: ${transaction.id} pour le paiement: ${payment_id}`);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id.toString(),
        reference: transaction.reference,
        amount: transaction.amount,
        status: transaction.status,
        crypto_currency: transaction.crypto_currency,
        pay_address: transaction.pay_address,
        payment_id: transaction.payment_id,
        created_at: transaction.created_at
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur création transaction dépôt:', error);
    return NextResponse.json(
      { error: `Erreur interne du serveur: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Récupérer les transactions de dépôt de l'utilisateur
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: BigInt(session.user.id),
        type: 'DEPOSIT'
      },
      include: {
        wallet: {
          select: {
            id: true,
            type: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit
    });

    // Compter le total pour la pagination
    const total = await prisma.transaction.count({
      where: {
        user_id: BigInt(session.user.id),
        type: 'DEPOSIT'
      }
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map(transaction => ({
        id: transaction.id.toString(),
        reference: transaction.reference,
        amount: transaction.amount,
        status: transaction.status,
        crypto_currency: transaction.crypto_currency,
        pay_address: transaction.pay_address,
        payment_id: transaction.payment_id,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        wallet: transaction.wallet
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Erreur récupération transactions:', error);
    return NextResponse.json(
      { error: `Erreur interne du serveur: ${error.message}` },
      { status: 500 }
    );
  }
}