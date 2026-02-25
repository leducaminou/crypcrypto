import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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
    let planId: bigint;
    try {
      planId = BigInt(id);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "L'ID du plan doit être un nombre valide" },
        { status: 400 }
      );
    }

    // Récupérer le plan d'investissement
    const plan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan d'investissement non trouvé" },
        { status: 404 }
      );
    }

    // Formater les données pour la réponse
    const responseData = {
      id: plan.id.toString(),
      name: plan.name,
      description: plan.description || null,
      min_amount: Number(plan.min_amount).toFixed(2),
      max_amount: plan.max_amount ? Number(plan.max_amount).toFixed(2) : null,
      daily_profit_percent: Number(plan.daily_profit_percent).toFixed(2),
      duration_days: plan.duration_days,
      withdrawal_lock_days: plan.withdrawal_lock_days,
      capital_return: plan.capital_return ? "true" : "false",
      is_active: plan.is_active ? "true" : "false",
      created_at: plan.created_at.toISOString(),
      updated_at: plan.updated_at.toISOString(),
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la récupération du plan:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}