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

interface RouteParams {
  params: Promise<{
    key: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { key } = resolvedParams;

    // Décoder la clé si elle contient des caractères spéciaux
    const decodedKey = decodeURIComponent(key);

    // Vérifier l'authentification admin si nécessaire
    // const session = await getServerSession(authOptions);
    // if (session?.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    // }

    // Récupérer le paramètre système par sa clé
    const systemSetting = await prisma.systemSetting.findUnique({
      where: { key: decodedKey },
    });

    if (!systemSetting) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètre système non trouvé' 
        },
        { status: 404 }
      );
    }

    // Sérialiser les BigInt
    const serializedSetting = serializeBigInt(systemSetting);

    return NextResponse.json({
      success: true,
      data: serializedSetting,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du paramètre système:', error);
    
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { key } = resolvedParams;
    const decodedKey = decodeURIComponent(key);

    // Vérifier les permissions admin
    const session = await getServerSession(authOptions);
    if (session?.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { value, description } = body;

    // Validation des données
    if (!value) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le champ value est obligatoire' 
        },
        { status: 400 }
      );
    }

    // Mettre à jour le paramètre
    const updatedSetting = await prisma.systemSetting.update({
      where: { key: decodedKey },
      data: {
        value,
        description: description !== undefined ? description : undefined,
        updated_at: new Date(),
      },
    });

    // Sérialiser les BigInt
    const serializedSetting = serializeBigInt(updatedSetting);

    return NextResponse.json({
      success: true,
      data: serializedSetting,
      message: 'Paramètre système mis à jour avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du paramètre système:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètre système non trouvé' 
        },
        { status: 404 }
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { key } = resolvedParams;
    const decodedKey = decodeURIComponent(key);

    // Vérifier les permissions admin
    const session = await getServerSession(authOptions);
    if (session?.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Supprimer le paramètre
    await prisma.systemSetting.delete({
      where: { key: decodedKey },
    });

    return NextResponse.json({
      success: true,
      message: 'Paramètre système supprimé avec succès',
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression du paramètre système:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètre système non trouvé' 
        },
        { status: 404 }
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