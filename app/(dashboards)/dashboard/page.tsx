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
import { calculateChange } from "@/app/lib/calculateUtils";
import Image from "next/image";
import { MoveDown, MoveUp, AlertTriangle } from "lucide-react";
import TradingTable from "@/app/components/ui/admin/TradingTable";
import ButtonLink from "@/app/components/ui/ButtonLink";

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
    null,
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
    null,
  );
  const [referralStatsLoading, setReferralStatsLoading] = useState(true);

  const REFERRAL_LINK = process.env.NEXT_PUBLIC_REFERRAL_LINK;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.type === "WITHDRAWAL" || tx.type === "DEPOSIT",
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
            : `Failed to fetch referral stats: ${errorText}`,
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
              : `Failed to fetch Investments: ${errorText}`,
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
              : `Failed to fetch user: ${errorText}`,
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
              `Failed to fetch profit wallet: ${walletResponse.status}`,
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
              `Failed to fetch profit wallet: ${walletResponse.status}`,
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

  const totalBalance = Number(wallet?.balance || 0) + Number(profitWallet?.balance || 0) + Number(bonusWallet?.balance || 0);

  const stats = [
    {
      title: "Solde total",
      value: `$${formatMonetary(totalBalance.toFixed(2).toString())}`,
      change: transactions ? calculateChange(transactions as any, totalBalance, 'TOTAL') : "+0.0%",
      icon: "💰",
    },
    {
      title: "Portefeuille",
      value: `$${wallet?.balance ? formatMonetary(wallet?.balance) : "0.00"}`,
      change: transactions ? calculateChange(transactions as any, Number(wallet?.balance || 0), 'DEPOSIT') : "+0.0%",
      icon: "📉",
    },
    {
      title: "Profit total",
      value: `$${
        profitWallet?.balance ? formatMonetary(profitWallet?.balance) : "0.00"
      }`,
      change: transactions ? calculateChange(transactions as any, Number(profitWallet?.balance || 0), 'PROFIT') : "+0.0%",
      icon: "📈",
    },
    {
      title: "Bonus total",
      value: `$${
        bonusWallet?.balance ? formatMonetary(bonusWallet?.balance) : "0.00"
      }`,
      change: transactions ? calculateChange(transactions as any, Number(bonusWallet?.balance || 0), 'BONUS') : "+0.0%",
      icon: "🎁",
    },
    {
      title: "Investissements actifs",
      value: activeInvestmentsCount.toString(),
      change: "+0",
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
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
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
    <div className="flex flex-col gap-6 text-white mt-24 px-2 md:px-0">
      {/* Alerte KYC */}
      {user && user.kycVerification?.status !== "APPROVED" && (
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-yellow-500/20 flex flex-shrink-0 items-center justify-center text-yellow-500">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="text-yellow-500 font-bold">Vérification d&apos;identité requise</h3>
              <p className="text-yellow-400/80 text-sm">
                Votre compte n&apos;est pas encore vérifié. Vos dépôts et retraits sont limités à 25$.
              </p>
            </div>
          </div>
          <ButtonLink href="/dashboard/profile" variant="primary" size="sm" className="whitespace-nowrap">
            Vérifier mon compte
          </ButtonLink>
        </div>
      )}

      {/* Statistiques principales en haut */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-2">
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

      <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 mb-8">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-extrabold mb-1 text-white">
                Programme de Parrainage
              </h2>
              <p className="text-gray-400 text-sm">
                Développez votre réseau et augmentez vos gains
              </p>
            </div>
            <ButtonLink
              href="/dashboard/referrals"
              variant="secondary"
              size="sm"
            >
              Voir tout <span className="ml-2">→</span>
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {referralStatsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ReferralStatsCard
                stats={referralStats || defaultReferralStats}
              />
            )}

            <div className="pt-4">
              <ReferralLinkCard2 referralLink={referralCode || ""} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center text-white">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Achat/Vente IA en temps réel
            </h3>
            <ButtonLink
              href="/dashboard/ai-trading"
              variant="link"
              size="sm"
              className="!px-0 !py-0"
            >
              Ouvrir le terminal →
            </ButtonLink>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
            <TradingTable />
          </div>
        </div>

        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h3 className="text-xl font-bold mb-6 text-white">Portefeuille Actif</h3>
          <div className="space-y-4">
            {investments && investments.length > 0 ? (
              investments
                .filter((investment) => investment.status === "ACTIVE")
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .slice(0, 3)
                .map((investment) => (
                  <div
                    key={investment.id}
                    className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-white group-hover:text-primary transition-colors text-sm uppercase tracking-wide">
                        {investment.plan.name || "Plan Standard"}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                        +
                        {(
                          (Number(investment.expected_profit) /
                            Number(investment.amount)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-lightblue">
                        <span>Montant investi</span>
                        <span className="text-white font-medium">
                          ${Number(investment.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-lightblue">
                        <span>Temps restant</span>
                        <span className="text-white font-medium">
                          {Math.ceil(
                            (new Date(investment.end_date).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          jours
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-lightblue text-sm mb-6">
                  Aucun investissement actif pour le moment
                </p>
                <ButtonLink
                  href="/dashboard/investments"
                  variant="primary"
                >
                  Investir maintenant
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 mb-12">
        <h2 className="text-xl font-bold mb-8 flex items-center text-white">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-3 text-primary">
            <MoveUp size={18} />
          </span>
          Historique des Transactions
        </h2>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-lightblue mb-8">
              Votre historique est encore vide
            </p>
            <div className="flex justify-center gap-4">
              <ButtonLink
                href="/dashboard/wallet"
                variant="secondary"
              >
                Déposer des fonds
              </ButtonLink>
              <ButtonLink
                href="/dashboard/investments"
                variant="primary"
              >
                Investir
              </ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-lightblue border-b border-white/5">
                    <th className="pb-4 font-bold uppercase tracking-wider text-[10px]">
                      Date
                    </th>
                    <th className="pb-4 font-bold uppercase tracking-wider text-[10px]">
                      Type de mouvement
                    </th>
                    <th className="pb-4 font-bold uppercase tracking-wider text-[10px]">
                      Montant total
                    </th>
                    <th className="pb-4 font-bold uppercase tracking-wider text-[10px]">
                      État actuel
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTransactions.map((tx) => {
                    const isDeposit = tx.type === "DEPOSIT";
                    const typeText = isDeposit
                      ? "Approvisionnement"
                      : "Retrait de fonds";
                    const amountColor = isDeposit
                      ? "text-green-400"
                      : "text-red-400";
                    const amountSign = isDeposit ? "+" : "-";

                    return (
                      <tr
                        key={tx.id}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="py-5 font-medium">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="py-5">
                          <span
                            className={`flex items-center gap-2 ${isDeposit ? "text-green-400" : "text-red-400"}`}
                          >
                            {isDeposit ? (
                              <MoveDown size={14} />
                            ) : (
                              <MoveUp size={14} />
                            )}
                            {typeText}
                          </span>
                        </td>
                        <td className={`py-5 font-bold ${amountColor}`}>
                          {amountSign}$
                          {formatMonetary(
                            Number(tx.amount).toFixed(2).toString(),
                          )}
                        </td>
                        <td className="py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                              tx.status === "COMPLETED"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : tx.status === "PENDING"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {tx.status === "COMPLETED"
                              ? "Validé"
                              : tx.status === "PENDING"
                                ? "En attente"
                                : "Annulé"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center border-t border-white/5 pt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
