import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/app/lib/prisma';
import { generateReferralCode, sanitizePrismaData } from '@/app/lib/utils';
import { RegisterSchema } from '@/app/lib/validations/AuthSchema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);
    
    const phone = validatedData.phonenumber;

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Vérifier si le téléphone existe déjà
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Un compte avec ce numéro de téléphone existe déjà' },
          { status: 400 }
        );
      }
    }

    // Trouver l'utilisateur parrain si un code de parrainage est fourni
    let referredByUserId: bigint | null = null;
    if (validatedData.referred_code && validatedData.referred_code.trim() !== '') {
      const referrer = await prisma.user.findUnique({
        where: { referral_code: validatedData.referred_code },
      });

      if (referrer) {
        referredByUserId = referrer.id;
      } else {
        return NextResponse.json(
          { error: "Le code d'invitation n'existe pas !" },
          { status: 404 }
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Utilisation d'une transaction pour créer user + wallets + referral
    const result = await prisma.$transaction(async (prisma) => {
      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          country_id: BigInt(validatedData.country_id),
          phone: phone,
          password_hash: hashedPassword,
          role: 'USER',
          referral_code: generateReferralCode(),
          referred_by: referredByUserId || null,
          is_active: true,
        },
      });

      // Créer les trois wallets (DEPOSIT, PROFIT et BONUS)
      const depositWallet = await prisma.wallet.create({
        data: {
          user_id: user.id,
          balance: 0,
          locked_balance: 0,
          type: 'DEPOSIT',
        },
      });

      const profitWallet = await prisma.wallet.create({
        data: {
          user_id: user.id,
          balance: 0,
          locked_balance: 0,
          type: 'PROFIT',
        },
      });

      const bonusWallet = await prisma.wallet.create({
        data: {
          user_id: user.id,
          balance: 0,
          locked_balance: 0,
          type: 'BONUS',
        },
      });

      // Créer l'enregistrement Referral si un parrain a été trouvé
      let referral = null;
      if (referredByUserId) {
        referral = await prisma.referral.create({
          data: {
            referred_by: referredByUserId,
            user_id: user.id,
            earnings: 0,
            status: 'ACTIVE',
            signed_up_at: new Date(),
          },
        });
      }

      return {
        user,
        depositWallet,
        profitWallet,
        bonusWallet,
        referral,
      };
    });

    // Sérialiser les données avant de les renvoyer
    const sanitizedResult = sanitizePrismaData(result);

    return NextResponse.json(
      { 
        message: 'Compte créé avec succès', 
        user: sanitizedResult.user,
        wallets: {
          deposit: sanitizedResult.depositWallet,
          profit: sanitizedResult.profitWallet,
          bonus: sanitizedResult.bonusWallet,
        },
        referral: sanitizedResult.referral
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données de formulaire invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    );
  }
}