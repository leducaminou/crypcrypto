import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}


// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id


    // Valider l'ID
    let kycId: bigint;
    try {
      kycId = BigInt(id);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "L'ID de la vérification KYC doit être un nombre valide" },
        { status: 400 }
      );
    }

    // Récupérer la vérification KYC avec l'utilisateur
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: kycId },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!kyc) {
      return NextResponse.json(
        { success: false, error: "Vérification KYC non trouvée" },
        { status: 404 }
      );
    }

    // Formater les données pour la réponse
    const responseData = {
      id: kyc.id.toString(),
      user_id: kyc.user_id.toString(),
      user: {
        email: kyc.user.email,
        first_name: kyc.user.first_name,
        last_name: kyc.user.last_name,
      },
      document_type: kyc.document_type,
      document_number: kyc.document_number,
      document_front_url: kyc.document_front_url,
      document_back_url: kyc.document_back_url,
      selfie_url: kyc.selfie_url,
      status: kyc.status,
      rejection_reason: kyc.rejection_reason,
      reviewed_by: kyc.reviewed_by ? kyc.reviewed_by.toString() : null,
      reviewed_at: kyc.reviewed_at ? kyc.reviewed_at.toISOString() : null,
      created_at: kyc.created_at.toISOString(),
      updated_at: kyc.updated_at.toISOString(),
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la vérification KYC:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
