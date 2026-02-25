import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { KycSchema } from "@/app/lib/validations/KycSchema";

const prisma = new PrismaClient();


// Interface pour les paramètres de route dans Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function PUT(
  request: Request, 
  { params }: RouteParams
) {

  
  try {

    // Résoudre les paramètres asynchrones
    const resolvedParams = await params
    const id = resolvedParams.id


    
    const body = await request.json();

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

    // Valider le body avec Zod
    const parsed = KycSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors },
        { status: 400 }
      );
    }

    const { status, rejection_reason } = parsed.data;

    // Mettre à jour la vérification KYC
    const updatedKyc = await prisma.kycVerification.update({
      where: { id: kycId },
      data: {
        status,
        rejection_reason: rejection_reason ?? null,
        reviewed_at: new Date(),
      },
    });

    // Formater la réponse pour convertir les BigInt en string
    const responseData = {
      id: updatedKyc.id.toString(),
      user_id: updatedKyc.user_id.toString(),
      document_type: updatedKyc.document_type,
      document_number: updatedKyc.document_number,
      document_front_url: updatedKyc.document_front_url,
      document_back_url: updatedKyc.document_back_url,
      selfie_url: updatedKyc.selfie_url,
      status: updatedKyc.status,
      rejection_reason: updatedKyc.rejection_reason,
      reviewed_by: updatedKyc.reviewed_by ? updatedKyc.reviewed_by.toString() : null,
      reviewed_at: updatedKyc.reviewed_at ? updatedKyc.reviewed_at.toISOString() : null,
      created_at: updatedKyc.created_at.toISOString(),
      updated_at: updatedKyc.updated_at.toISOString(),
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du statut KYC:", error);
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: "Vérification KYC non trouvée" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}