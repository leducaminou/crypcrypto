import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { InvestmentPlanSchema } from "@/app/lib/validations/InvestmentShema";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

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

    // Vérifier si le plan existe
    const existingPlan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: "Plan d'investissement non trouvé" },
        { status: 404 }
      );
    }

    // Valider les données
    const validation = InvestmentPlanSchema.safeParse(updateData);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      min_amount,
      max_amount,
      daily_profit_percent,
      duration_days,
      withdrawal_lock_days,
      capital_return,
      is_active,
    } = validation.data;

    // Vérification des champs numériques
    if (
      isNaN(min_amount) ||
      (max_amount !== undefined && isNaN(max_amount)) ||
      isNaN(daily_profit_percent) ||
      isNaN(duration_days) ||
      isNaN(withdrawal_lock_days)
    ) {
      return NextResponse.json(
        { success: false, error: "Les champs numériques doivent être valides" },
        { status: 400 }
      );
    }

    // Validation supplémentaire : min_amount <= max_amount si max_amount est défini
    if (max_amount !== undefined && min_amount > max_amount) {
      return NextResponse.json(
        { success: false, error: "Le montant minimum ne peut pas être supérieur au montant maximum" },
        { status: 400 }
      );
    }

    // Mettre à jour le plan
    const updatedPlan = await prisma.investmentPlan.update({
      where: { id: planId },
      data: {
        name,
        description: description || null,
        min_amount: min_amount,
        max_amount: max_amount || null,
        daily_profit_percent: daily_profit_percent,
        duration_days: duration_days,
        withdrawal_lock_days: withdrawal_lock_days,
        capital_return: capital_return === "true",
        is_active: is_active === "true",
      },
    });

    // Formater les données pour la réponse
    const responseData = {
      ...updatedPlan,
      id: updatedPlan.id.toString(),
      min_amount: Number(updatedPlan.min_amount).toFixed(2),
      max_amount: updatedPlan.max_amount ? Number(updatedPlan.max_amount).toFixed(2) : null,
      daily_profit_percent: Number(updatedPlan.daily_profit_percent).toFixed(2),
      capital_return: updatedPlan.capital_return ? "true" : "false",
      is_active: updatedPlan.is_active ? "true" : "false",
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du plan:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}