import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth.config';

const prisma = new PrismaClient();

// Fonction utilitaire pour sérialiser les BigInt
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializeBigInt(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification si nécessaire
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    // }

    // Récupérer tous les paramètres système
    const systemSettings = await prisma.systemSetting.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    // Sérialiser les BigInt
    const serializedSettings = serializeBigInt(systemSettings);

    return NextResponse.json({
      success: true,
      data: serializedSettings,
      count: systemSettings.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres système:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier les permissions admin si nécessaire
    const session = await getServerSession(authOptions);
    if (session?.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    // Validation des données
    if (!key || !value) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Les champs key et value sont obligatoires' 
        },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour le paramètre
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: description || null,
        updated_at: new Date(),
      },
      create: {
        key,
        value,
        description: description || null,
      },
    });

    // Sérialiser les BigInt
    const serializedSetting = serializeBigInt(setting);

    return NextResponse.json({
      success: true,
      data: serializedSetting,
      message: 'Paramètre système sauvegardé avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde du paramètre système:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Une clé avec cette valeur existe déjà' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}