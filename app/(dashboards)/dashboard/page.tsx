"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PaymentMethod,
  ReferralStats,
  UserResponse,
  InvestmentResponse,
} from "@/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { Roles } from "@/app/lib/auth.config";
import { useToast } from "@/hooks/use-toast";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { Pagination } from "@/app/components/ui/Pagination";
import { WalletResponse } from "./withdrawals/page";
import StatsCard from "@/app/components/ui/dashboard/StatsCard";
import ReferralStatsCard from "@/app/components/ui/dashboard/ReferralStatsCard";
import ReferralLinkCard2 from "@/app/components/ui/dashboard/ReferralLinkCard2";
import Link from "next/link";
import { formatMonetary } from "@/app/lib/utils";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import SectionError from "@/app/components/ui/SectionError";
import Image from "next/image";
import { MoveDown, MoveUp } from "lucide-react";
import TradingTable from "@/app/components/ui/admin/TradingTable";

interface TransactionResponse {
  id: string;
  user_id: string;
  wallet_id: string;
  txid: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  reference: string | null;
  details: string | null;
  metadata: any | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  paymentAccount?: {
    id: string;
    type: PaymentMethod;
    account_identifier: string;
    provider: string;
  } | null;
}

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();

  const router = useRouter();
  const { showError } = useToast();
  const { data: session, status } = useSession();

  const [investments, setInvestments] = useState<InvestmentResponse[] | null>(
    null
  );
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [profitWallet, setProfitWallet] = useState<WalletResponse | null>(null);
  const [bonusWallet, setBonusWallet] = useState<WalletResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [referralStatsLoading, setReferralStatsLoading] = useState(true);

  const REFERRAL_LINK = process.env.NEXT_PUBLIC_REFERRAL_LINK;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.type === "WITHDRAWAL" || tx.type === "DEPOSIT"
    );
  }, [transactions]);

  // Fonction pour récupérer les statistiques de parrainage
  const fetchReferralStats = async (userId: string) => {
    try {
      setReferralStatsLoading(true);
      const response = await fetch(`/api/user/referral/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 404
            ? "Statistiques de parrainage non trouvées"
            : `Failed to fetch referral stats: ${errorText}`
        );
      }

      const data: ReferralStats = await response.json();
      setReferralStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching referral stats:", errorMessage);
      // Ne pas afficher l'erreur à l'utilisateur pour ne pas perturber l'expérience
    } finally {
      setReferralStatsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInvestments = async () => {
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
              ? "Aucun investissement trouvé"
              : `Failed to fetch Investments: ${errorText}`
          );
        }

        const data: InvestmentResponse[] = await response.json();
        setInvestments(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas d'investissements
        if (
          errorMessage.includes("404") ||
          errorMessage.includes("not found")
        ) {
          setInvestments([]);
        } else {
          setError(errorMessage);
          showError(errorMessage);
        }
      }
    };

    const fetchTransactions = async () => {
      try {
        if (!id) throw new Error("User ID is not available");

        const response = await fetch(`/api/user/transactions/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setTransactions([]);
            return;
          }
          throw new Error("Failed to fetch transactions");
        }

        const data: TransactionResponse[] = await response.json();
        setTransactions(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de transactions
        if (!errorMessage.includes("404")) {
          setError(errorMessage);
          showError("Failed to load transactions");
        } else {
          setTransactions([]);
        }
      }
    };

    const fetchUser = async () => {
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
              ? "Utilisateur non trouvé"
              : `Failed to fetch user: ${errorText}`
          );
        }

        const data: UserResponse = await response.json();
        setUser(data);
        setReferralCode(REFERRAL_LINK + data.user.referral_code);

        // Récupérer les statistiques de parrainage après avoir l'utilisateur
        await fetchReferralStats(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        showError(errorMessage);
      }
    };

    const fetchProfitWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const walletResponse = await fetch(`/api/user/wallet/profit/${id}`);
        if (!walletResponse.ok) {
          if (walletResponse.status === 404) {
            setProfitWallet(null);
          } else {
            throw new Error(
              `Failed to fetch profit wallet: ${walletResponse.status}`
            );
          }
        } else {
          const walletData: WalletResponse = await walletResponse.json();
          setProfitWallet(walletData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchBonustWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const walletResponse = await fetch(`/api/user/wallet/bonus/${id}`);
        if (!walletResponse.ok) {
          if (walletResponse.status === 404) {
            setProfitWallet(null);
          } else {
            throw new Error(
              `Failed to fetch profit wallet: ${walletResponse.status}`
            );
          }
        } else {
          const walletData: WalletResponse = await walletResponse.json();
          setBonusWallet(walletData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const walletResponse = await fetch(`/api/user/wallet/${id}`);
        if (!walletResponse.ok) {
          if (walletResponse.status === 404) {
            setWallet(null);
          } else {
            throw new Error(`Failed to fetch wallet: ${walletResponse.status}`);
          }
        } else {
          const walletData: WalletResponse = await walletResponse.json();
          setWallet(walletData);
        }
      } catch (err) {
        console.error("Error fetching deposit data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchInvestments(),
          fetchTransactions(),
          fetchUser(),
          fetchWallet(),
          fetchProfitWallet(),
          fetchBonustWallet(),
        ]);
      } catch (err) {
        console.error("Error in fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError("User ID is not available");
      setLoading(false);
    }
  }, [id]);

  const activeInvestmentsCount = investments
    ? investments.filter((inv) => inv.status === "ACTIVE").length
    : 0;

  const stats = [
    {
      title: "Solde total",
      value: `$${formatMonetary(
        (Number(wallet?.balance || 0) + Number(profitWallet?.balance || 0))
          .toFixed(2)
          .toString()
      )}`,
      change: "+5.2%",
      icon: "💰",
    },
    {
      title: "Portefeuille",
      value: `$${wallet?.balance ? formatMonetary(wallet?.balance) : "0.00"}`,
      change: "+12.7%",
      icon: "📈",
    },
    {
      title: "Profit total",
      value: `$${
        profitWallet?.balance ? formatMonetary(profitWallet?.balance) : "0.00"
      }`,
      change: "+12.7%",
      icon: "📈",
    },
    {
      title: "Bonus total",
      value: `$${
        bonusWallet?.balance ? formatMonetary(bonusWallet?.balance) : "0.00"
      }`,
      change: "+12.7%",
      icon: "📈",
    },
    {
      title: "Investissements actifs",
      value: activeInvestmentsCount.toString(),
      change: "+1",
      icon: "💼",
    },
  ];

  // Statistiques de parrainage par défaut
  const defaultReferralStats: ReferralStats = {
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: `$0.00`,
    pendingRewards: "0.00$",
  };

  const paginatedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const handleSuccess = () => router.refresh();

  if (status === "loading" || loading) return <SectionLoadingSpinner />;

  if (error && !investments && !transactions && !wallet && !profitWallet) {
    return <SectionError error={error} />;
  }

  if (!session)
    return (
      <div className="text-center text-red-400">Veuillez vous connecter</div>
    );

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Programme de parrainage
            </span>
          </h2>
          <Link
            href="/dashboard/referrals"
            className="text-primary hover:text-blue-600 text-sm flex items-center"
          >
            Voir tout <span className="ml-1">→</span>
          </Link>
        </div>

        {referralStatsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <ReferralStatsCard stats={referralStats || defaultReferralStats} />
        )}

        <ReferralLinkCard2 referralLink={referralCode || ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 lg:col-span-2">
          <div className="flex justify-between gap-2">
            <h3 className="text-lg font-semibold mb-4">
              Achat vente par IA en temps réel
            </h3>
            <Link href="/dashboard/ai-trading" className="text-cyan-500 hover:text-cyan-300">
              Voir plus
            </Link>
          </div>
          <TradingTable />
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Investissements actifs</h3>
          <div className="space-y-4">
            {investments && investments.length > 0 ? (
              investments
                .filter((investment) => investment.status === "ACTIVE")
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .slice(0, 3)
                .map((investment) => (
                  <div
                    key={investment.id}
                    className="p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {investment.plan.name || "Plan inconnu"}
                      </span>
                      <span className="text-cyan-400">
                        {(
                          (Number(investment.expected_profit) /
                            Number(investment.amount)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <p>Montant: {Number(investment.amount).toFixed(2)}$</p>
                      <p>
                        Jours restants:{" "}
                        {Math.ceil(
                          (new Date(investment.end_date).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Aucun investissement actif</p>
                <Link
                  href="/dashboard/investments"
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Commencer à investir →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-6">
          Historique des transactions
        </h2>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Aucune transaction disponible</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard/wallet"
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Faire un dépôt →
              </Link>
              <Link
                href="/dashboard/investments"
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Investir →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => {
                    const isDeposit = tx.type === "DEPOSIT";
                    const typeText = isDeposit ? "Dépôt" : "Retrait";
                    const amountColor = isDeposit
                      ? "text-green-400"
                      : "text-red-400";
                    const amountSign = isDeposit ? "+" : "-";

                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-gray-700 hover:bg-gray-700"
                      >
                        <td className="py-3">{formatDate(tx.created_at)}</td>
                        <td>{typeText}</td>
                        <td className={amountColor}>
                          {amountSign}
                          {"$"}
                          {formatMonetary(
                            Number(tx.amount).toFixed(2).toString()
                          )}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === "COMPLETED"
                                ? "bg-green-900 text-green-400"
                                : tx.status === "PENDING"
                                ? "bg-yellow-900 text-yellow-400"
                                : "bg-red-900 text-red-400"
                            }`}
                          >
                            {tx.status === "COMPLETED"
                              ? "Complété"
                              : tx.status === "PENDING"
                              ? "En attente"
                              : "Échoué"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-4"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
