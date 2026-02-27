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
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<UserResponse | null>(null);

  const router = useRouter();



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
            : `Failed to fetch user: ${errorText}`,
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
            : `Failed to fetch Investments: ${errorText}`,
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
          "No wallets found or error fetching wallets, using empty array",
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

  const handleSuccess = useCallback(() => {
    fetchInvestments();
    fetchWallets();
  }, [fetchInvestments, fetchWallets]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Fonction pour convertir InvestmentResponse en Investment
  const mapInvestmentResponseToInvestment = (
    investment: InvestmentResponse,
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
      Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
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
      .map(mapInvestmentResponseToInvestment)
      .sort((a, b) => b.id - a.id);
  }, [investments]);

  const completedInvestments = useMemo(() => {
    if (!investments) return [];
    return investments
      .filter((inv) => inv.status === InvestmentStatus.COMPLETED)
      .map(mapInvestmentResponseToInvestment)
      .sort((a, b) => b.id - a.id);
  }, [investments]);

  // Vérifier si l'utilisateur a des wallets disponibles pour l'investissement
  const hasWallets = wallets && wallets.length > 0;

  useEffect(() => {
    console.log("wallets", wallets);
  }, [wallets]);

  if (loading) return <SectionLoadingSpinner />;

  if (error) return <SectionError error={error} />;

  return (
    <div className="flex flex-col gap-6 text-white mt-24 px-2 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Mes Investissements
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gérez vos actifs et générez des rendements passifs
          </p>
        </div>
        <div className="flex gap-4">
          <ButtonWithModal
            title="Calculateur"
            button
            className="hidden md:flex"
            content={<ProfitCalculator />}
            onSuccess={handleSuccess}
          />
          {!loading && (
            <ButtonWithModal
              title="Nouvel Investissement"
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
      <section className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 mb-6 relative group">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xl font-bold flex items-center text-white">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Investissements Actifs
          </h2>
          {activeInvestments.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
              {activeInvestments.length} actif
              {activeInvestments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {activeInvestments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {activeInvestments.map((investment) => (
              <InvestmentCard key={investment.id} {...investment} />
            ))}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center py-12 px-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <EmptyState
              title="Aucun investissement actif"
              description="Saisissez l'opportunité et commencez à faire fructifier votre capital dès aujourd'hui."
            />

            <div className="flex gap-4 mt-8">
              {!loading && (
                <ButtonWithModal
                  title="Ouvrir un plan de trading IA"
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
      <section className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 relative group">
        <h2 className="text-xl font-bold mb-8 flex items-center text-white">
          <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-3 text-lightblue">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          </span>
          Historique des Investissements
        </h2>

        {completedInvestments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedInvestments.map((investment) => (
              <InvestmentCard key={investment.id} {...investment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <EmptyState
              title="Historique vide"
              description="Vos investissements terminés s'afficheront ici une fois leur cycle complété."
            />
          </div>
        )}
      </section>
    </div>
  );
}
