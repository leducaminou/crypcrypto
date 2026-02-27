import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { WalletType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { user_id, type } = await request.json();

    if (!user_id || !type) {
      return NextResponse.json({ error: 'Missing parameters user_id or type' }, { status: 400 });
    }

    // Verify if type is a valid WalletType
    if (!Object.values(WalletType).includes(type as WalletType)) {
      return NextResponse.json({ error: 'Invalid wallet type' }, { status: 400 });
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        user_id: BigInt(user_id),
        type: type as WalletType
      }
    });

    if (existingWallet) {
      return NextResponse.json({ 
        message: 'Wallet already exists', 
        wallet: { 
          ...existingWallet, 
          id: existingWallet.id.toString(), 
          user_id: existingWallet.user_id.toString(),
          balance: existingWallet.balance.toString(),
          locked_balance: existingWallet.locked_balance.toString(),
        } 
      }, { status: 200 });
    }

    // Create the wallet
    const wallet = await prisma.wallet.create({
      data: {
        user_id: BigInt(user_id),
        type: type as WalletType,
        balance: 0,
        locked_balance: 0
      }
    });

    return NextResponse.json({ 
      message: 'Wallet created', 
      wallet: { 
        ...wallet, 
        id: wallet.id.toString(), 
        user_id: wallet.user_id.toString(),
        balance: wallet.balance.toString(),
        locked_balance: wallet.locked_balance.toString(),
      } 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
