"use client";

import { useState, useEffect, useCallback } from "react";
import { PaymentMethod, UserResponse, InvestmentResponse } from "@/types";
import { calculateChange } from "@/app/lib/calculateUtils";
import ButtonWithModal from "@/app/components/modal/ButtonWithModal";
import { useRouter } from "next/navigation";
import LoadingSpiner from "@/app/components/ui/PageLoadingSpiner";
import {
  formatMonetary,
  getPaiementMethod,
  getStatusColor,
  getStatusTranslation,
  getTransactionTypeTranslation,
} from "@/app/lib/utils";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { Roles } from "@/app/lib/auth.config";
import { useToast } from "@/hooks/use-toast";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { Pagination } from "@/app/components/ui/Pagination";
import { ITEMS_PER_PAGE } from "@/app/lib/constants";
import { ApiPaymentAccount, WalletResponse } from "../withdrawals/page";
import StatsCard from "@/app/components/ui/dashboard/StatsCard";
import CryptoCheckout from "@/app/components/ui/CryptoCheckout";
import ChoiceWalletChoiceButtons from "@/app/components/ui/forms/WalletChoiceButton";
import SectionError from "@/app/components/ui/SectionError";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import { MoveUp, AlertTriangle } from "lucide-react";
import ButtonLink from "@/app/components/ui/ButtonLink";

// Interface pour la réponse de l'API de transactions
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

// Fonction pour formater la date au format DD/MM/YYYY
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function WalletPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();
  const router = useRouter();

  const { showError } = useToast();

  const [transactions, setTransactions] = useState<
    TransactionResponse[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profitWallet, setProfitWallet] = useState<WalletResponse | null>(null);
  const [bonusWallet, setBonusWallet] = useState<WalletResponse | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<ApiPaymentAccount[]>(
    [],
  );
  const [user, setUser] = useState<UserResponse | null>(null);
  const [investments, setInvestments] = useState<InvestmentResponse[] | null>(
    null,
  );

  const handleSuccess = () => {
    router.refresh();
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!id) throw new Error("User ID is not available");

        const response = await fetch(`/api/user/transactions/${id}`);
        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data: TransactionResponse[] = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        showError("Failed to load transactions");
      } finally {
        setLoading(false);
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

    const fetchBonusWallet = async () => {
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
            setBonusWallet(null);
          } else {
            throw new Error(
              `Failed to fetch Bonus wallet: ${walletResponse.status}`,
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

    const fetchInvestments = async () => {
      try {
        if (!id) throw new Error("User ID is not available");
        const response = await fetch(`/api/user/investment/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          setInvestments([]);
        } else {
          setError(errorMessage);
          showError(errorMessage);
        }
      }
    };

    const fetchData = async () => {
      try {
        // Automatically create required wallets if they do not exist
        await Promise.all(
          ["DEPOSIT", "PROFIT", "BONUS"].map((type) =>
            fetch("/api/wallet/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: id, type }),
            })
          )
        );
      } catch (err) {
        console.error("Error creating wallets:", err);
      }

      await Promise.all([
        fetchTransactions(),
        fetchUser(),
        fetchWallet(),
        fetchProfitWallet(),
        fetchBonusWallet(),
        fetchInvestments(),
      ]);
      setLoading(false);
    };

    if (id) {
      fetchData();
    } else {
      setError("User ID is not available");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {}, [user]);

  const totalBalance = Number(wallet?.balance || 0) + Number(profitWallet?.balance || 0) + Number(bonusWallet?.balance || 0);

  const activeInvestmentsCount = investments
    ? investments.filter((inv) => inv.status === "ACTIVE").length
    : 0;

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

  // Calcul des données paginées
  const paginatedTransactions = transactions
    ?.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    ?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPages = transactions
    ? Math.ceil(transactions.length / ITEMS_PER_PAGE)
    : 0;

  if (loading) return <SectionLoadingSpinner />;

  if (error) return <SectionError error={error} />;

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

      {/* En-tête avec solde et bouton de paiement */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Mon Portefeuille
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gérez vos fonds et suivez vos transactions
          </p>
        </div>

        {wallet && (
          <ButtonWithModal
            title="Ajouter des fonds"
            button
            variant="primary"
            content={
              <ChoiceWalletChoiceButtons
                wallet={wallet}
                type="create"
                user_id={id}
                onModalClose={() => setIsModalOpen(false)}
              />
            }
            onSuccess={handleSuccess}
          />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-2">
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

      {/* Historique des paiements */}
      <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center text-white">
            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-3 text-primary">
              <MoveUp size={18} />
            </span>
            Historique des Transactions
          </h2>
        </div>

        {error ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-red-500/20 text-red-400">
            {error}
          </div>
        ) : paginatedTransactions && paginatedTransactions.length > 0 ? (
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
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-5 font-medium">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-5">
                        <span className="px-3 py-1 rounded-lg bg-white/5 text-xs">
                          {getTransactionTypeTranslation(tx.type)}
                        </span>
                      </td>
                      <td
                        className={`py-5 font-bold ${tx.type === "DIVIDEND" || tx.type === "REFERRAL" ? "text-green-400" : "text-white"}`}
                      >
                        {formatMonetary(
                          Number(tx.amount).toFixed(2).toString(),
                        )}
                        $
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
                          {getStatusTranslation(tx.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
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
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-lightblue text-sm">
              Aucune transaction disponible pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
