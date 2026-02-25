"use client";
import StatsCard from "@/app/components/ui/dashboard/StatsCard";
import ReferralStatsCard from "@/app/components/ui/dashboard/ReferralStatsCard";
import { InvestmentResponse, ReferralStats, UserResponse } from "@/types";
import Link from "next/link";
import ReferralLinkCard2 from "@/app/components/ui/dashboard/ReferralLinkCard2";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { Roles } from "@/app/lib/auth.config";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { useState, useEffect, useMemo, useCallback } from "react";
import LoadingSpiner from "@/app/components/ui/LoadingSpiner";
import PageLoadingSpiner from "@/app/components/ui/PageLoadingSpiner";
import { useToast } from "@/hooks/use-toast";
import { InvestmentStatus, WalletType } from "@prisma/client";
import EmptyState from "@/app/components/ui/dashboard/EmptyState";
import InvestmentCard from "@/app/components/ui/dashboard/InvestmentCard";
import ButtonWithModal from "@/app/components/modal/ButtonWithModal";
import InvestmentForm from "@/app/components/ui/forms/InvestmentForm";
import { useRouter } from "next/navigation";
import SectionError from "@/app/components/ui/SectionError";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import { calculateProfitBasedOnDaysService } from "@/app/services/CalculateProfitBasedOnDaysService";
import ProfitCalculator from "@/app/components/pages/ProfitCalculator";

interface Investment {
  id: number;
  name: string;
  amount: string;
  dailyProfit: string;
  totalProfit: string;
  totalProfitCalculated: string;
  duration: string;
  remainingDays: number;
  status: "ACTIVE" | "COMPLETED";
}

interface WalletResponse {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  type: WalletType;
  created_at: string;
  updated_at: string;
}

export default function InvestmentsPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();

  const [investments, setInvestments] = useState<InvestmentResponse[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<UserResponse | null>(null);

  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  const fetchUser = useCallback(async () => {
    try {
      if (!id) {
        throw new Error("User ID is not available");
      }
      const response = await fetch(`/api/user/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 404
            ? "User not found"
            : `Failed to fetch user: ${errorText}`
        );
      }

      const data: UserResponse = await response.json();
      setUser(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [id, showError]);

  const fetchInvestments = useCallback(async () => {
    try {
      if (!id) {
        throw new Error("User ID is not available");
      }
      const response = await fetch(`/api/user/investment/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 404
            ? "Investments not found"
            : `Failed to fetch Investments: ${errorText}`
        );
      }

      const data: InvestmentResponse[] = await response.json();
      setInvestments(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [id, showError]);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const walletsResponse = await fetch(`/api/user/wallet/all/${id}`);

      if (!walletsResponse.ok) {
        console.warn(
          "No wallets found or error fetching wallets, using empty array"
        );
        setWallets([]);
        return;
      }

      const walletsData: WalletResponse[] = await walletsResponse.json();

      if (Array.isArray(walletsData)) {
        setWallets(walletsData);
      } else {
        console.warn("Wallets data is not an array, converting to array");
        setWallets(walletsData ? [walletsData] : []);
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {}, [fetchInvestments]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Fonction pour convertir InvestmentResponse en Investment
  const mapInvestmentResponseToInvestment = (
    investment: InvestmentResponse
  ): Investment => {
    const startDate = new Date(investment.start_date);
    const endDate = new Date(investment.end_date);
    const today = new Date();

    // Calcul de la durée en jours
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calcul des jours restants
    const remainingMs = endDate.getTime() - today.getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
    );

    // Calcul du profit quotidien
    const expectedProfit = parseFloat(investment.expected_profit);
    const dailyProfit =
      durationDays > 0 ? (expectedProfit / durationDays).toFixed(2) : "0.00";

    // Calcul du profit total basé sur les jours écoulés en utilisant le service
    const totalProfitCalculated = calculateProfitBasedOnDaysService(investment);

    return {
      id: parseInt(investment.id),
      name: investment.plan.name ?? "Plan inconnu",
      amount: investment.amount,
      dailyProfit,
      totalProfit: totalProfitCalculated,
      totalProfitCalculated: totalProfitCalculated,
      duration: `${durationDays} jours`,
      remainingDays,
      status:
        investment.status === InvestmentStatus.ACTIVE ? "ACTIVE" : "COMPLETED",
    };
  };

  // Filtrer les investissements actifs et terminés
  const activeInvestments = useMemo(() => {
    if (!investments) return [];
    return investments
      .filter((inv) => inv.status === InvestmentStatus.ACTIVE)
      .map(mapInvestmentResponseToInvestment);
  }, [investments]);

  const completedInvestments = useMemo(() => {
    if (!investments) return [];
    return investments
      .filter((inv) => inv.status === InvestmentStatus.COMPLETED)
      .map(mapInvestmentResponseToInvestment);
  }, [investments]);

  // Vérifier si l'utilisateur a des wallets disponibles pour l'investissement
  const hasWallets = wallets && wallets.length > 0;

  useEffect(() => {
    console.log("wallets", wallets);
  }, [wallets]);

  if (loading) return <SectionLoadingSpinner />;

  if (error) return <SectionError error={error} />;

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mes investissements</h1>
        <div className="flex gap-4">
              <ButtonWithModal
                title="Calculateur de profit"
                button
                content={<ProfitCalculator />}
                onSuccess={handleSuccess}
              />
              {!loading && (
                <ButtonWithModal
                  title="Investir"
                  button
                  content={
                    <InvestmentForm
                      wallets={wallets}
                      type="create"
                      user_id={id}
                      onModalClose={() => setIsModalOpen(false)}
                    />
                  }
                  onSuccess={handleSuccess}
                />
              )}
            </div>
      </div>

      {/* Investissements actifs */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-6 flex items-center">
          <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
          Investissements actifs
        </h2>

        {activeInvestments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeInvestments.map((investment) => (
              <InvestmentCard key={investment.id} {...investment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              title="Aucun investissement actif"
              description="Vos investissements actifs apparaîtront ici."
            />

            <div className="flex gap-4">
              <ButtonWithModal
                title="Calculateur de profit"
                button
                content={<ProfitCalculator />}
                onSuccess={handleSuccess}
              />
              {!loading && (
                <ButtonWithModal
                  title="Investir"
                  button
                  content={
                    <InvestmentForm
                      wallets={wallets}
                      type="create"
                      user_id={id}
                      onModalClose={() => setIsModalOpen(false)}
                    />
                  }
                  onSuccess={handleSuccess}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* Investissements terminés */}
      <section>
        <h2 className="text-lg font-semibold mb-6 flex items-center">
          <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
          Historique des investissements
        </h2>

        {completedInvestments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedInvestments.map((investment) => (
              <InvestmentCard key={investment.id} {...investment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              title="Aucun investissement terminé"
              description="Vos investissements terminés apparaîtront ici."
            />
            {!loading && (
              <ButtonWithModal
                title="Investir"
                button
                content={
                  <InvestmentForm
                    wallets={wallets}
                    type="create"
                    user_id={id}
                    onModalClose={() => setIsModalOpen(false)}
                  />
                }
                onSuccess={handleSuccess}
              />
            )}
          </div>
        )}
      </section>

      {/* Message si aucun wallet disponible
      {!hasWallets && !loading && (
        <div className="text-center py-8">
          <p className="text-yellow-500 mb-4">
            Aucun wallet disponible pour effectuer des investissements.
          </p>
          <p className="text-gray-400">
            Veuillez contacter l'administrateur ou créer un wallet.
          </p>
        </div>
      )} */}
    </div>
  );
}
