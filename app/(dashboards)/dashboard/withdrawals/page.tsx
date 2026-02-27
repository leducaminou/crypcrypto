"use client";
import WithdrawalForm from "@/app/components/ui/forms/WithdrawalForm";
import WithdrawalCard from "@/app/components/WithdrawalCard";
import { useIdContext } from "@/app/components/wrapper/ClientWrapper";
import { Roles } from "@/app/lib/auth.config";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { useState, useEffect, useCallback } from "react";
import {
  PaymentMethod,
  TransactionType,
  TransactionStatus,
  Wallet,
} from "@prisma/client";
import { UserResponse, WithdrawalStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import LoadingSpiner from "@/app/components/ui/LoadingSpiner";
import ErrorComponent from "@/app/components/ui/ErrorComponent";
import SectionLoadingSpinner from "@/app/components/ui/SectionLoadingSpinner";
import SectionError from "@/app/components/ui/SectionError";
import { formatMonetary } from "@/app/lib/utils";
import ButtonLink from "@/app/components/ui/ButtonLink";

// Interface pour les données de retrait (basée sur WithdrawalResponse de l'API)
interface WithdrawalResponse {
  id: string;
  transaction_id: string;
  user_id: string;
  payment_account_id: string | null;
  method: PaymentMethod;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  transaction: {
    id: string;
    user_id: string;
    wallet_id: string;
    payment_account_id: string | null;
    txid: string | null;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    wallet_address: string | null;
    reference: string | null;
    mobile_account: string | null;
    mobile_bank: string | null;
    details: string | null;
    metadata: any | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  payment_account: {
    type: PaymentMethod;
    account_identifier: string;
    provider: string;
  };
}

// Interface pour les données du portefeuille (côté client, champs en string)
export interface WalletResponse {
  id: string;
  user_id: string;
  balance: string;
  locked_balance: string;
  created_at: string;
  updated_at: string;
}
export interface ApiPaymentAccount {
  id: string;
  user_id: string;
  method: PaymentMethod;
  account_identifier: string;
  provider: string;
}

export default function WithdrawalsPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();

  const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const [paymentAccounts, setPaymentAccounts] = useState<ApiPaymentAccount[]>(
    []
  );
  const [profitWallet, setProfitWallet] = useState<WalletResponse | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);

  const fetchProfitWallet = useCallback(async () => {
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
  }, [id]);

  const fetchWithdrawal = useCallback(async () => {
    try {
      const withdrawalResponse = await fetch(`/api/user/withdrawals/${id}`);
      if (!withdrawalResponse.ok) {
        if (withdrawalResponse.status === 404) {
          setWithdrawals([]);
        } else {
          throw new Error(
            `Failed to fetch withdrawals: ${withdrawalResponse.status}`
          );
        }
      } else {
        const withdrawalData: WithdrawalResponse[] =
          await withdrawalResponse.json();
        setWithdrawals(withdrawalData);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
      setError("Failed to load withdrawals");
    }
  }, [id]);

  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/payment-account/${id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch payment accounts");
      const data = await response.json();
      setPaymentAccounts(data);
    } catch (error) {
      console.error("Error fetching payment accounts:", error);
      setError("Failed to load payment accounts");
    }
  }, [id]);

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
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUser(),
          fetchProfitWallet(),
          fetchPaymentAccounts(),
          fetchWithdrawal(),
        ]);
      } catch (error) {
        console.error("Error in initial data loading:", error);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchPaymentAccounts, fetchWithdrawal, fetchProfitWallet]);

  useEffect(() => {
    console.log("paymentAccounts", paymentAccounts);
  }, [paymentAccounts]);
  useEffect(() => {
    console.log("profitWallet", profitWallet);
  }, [profitWallet]);

  // Mapper TransactionStatus vers WithdrawalStatus
  const mapTransactionStatusToWithdrawalStatus = (
    status: TransactionStatus
  ): WithdrawalStatus => {
    switch (status) {
      case TransactionStatus.PENDING:
        return "PENDING";
      case TransactionStatus.COMPLETED:
        return "COMPLETED";
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
        return "FAILED";
      case TransactionStatus.CANCELLED:
        return "CANCELLED";
      default:
        return "PENDING";
    }
  };

  if (loading || !user) return <SectionLoadingSpinner />;

  if (error) return <SectionError error={error} />;

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mes retraits</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
       {profitWallet && paymentAccounts.length > 0 ? (
  Number(profitWallet.balance) > 0 ? (
    <div className="lg:col-span-1">
      <WithdrawalForm
        wallet={profitWallet}
        type="create"
        user_id={id}
        kycStatus={user?.kycVerification?.status || "PENDING"}
        paymentAccounts={paymentAccounts}
      />
    </div>
  ) : Number(profitWallet.balance) >= 0 ? (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Solde du compte profit est 0</p>
        <ButtonLink
          href="/dashboard/investments"
          variant="link"
          className="!px-0 !py-0"
        >
          Veillez investir →
        </ButtonLink>
      </div>
    </div>
  ) : (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Aucune méthode de retrait disponible</p>
        <ButtonLink
          href="/dashboard/profile"
          variant="link"
          className="!px-0 !py-0"
        >
          Completer le profile →
        </ButtonLink>
      </div>
    </div>
  )
) : null}

        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-6">
              Historique des retraits
            </h2>

            {withdrawals.length > 0 ? (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <WithdrawalCard
                    key={withdrawal.id}
                    id={withdrawal.id}
                    rejection_reason={withdrawal.rejection_reason || ""}
                    amount={`${formatMonetary(withdrawal.transaction.amount)}$`}
                    method={withdrawal.payment_account.type}
                    provider={withdrawal.payment_account.provider}
                    type={
                      withdrawal.transaction.type === TransactionType.WITHDRAWAL
                        ? "withdrawal"
                        : "wallet"
                    }
                    date={new Date(withdrawal.created_at).toLocaleDateString(
                      "fr-FR"
                    )}
                    status={mapTransactionStatusToWithdrawalStatus(
                      withdrawal.transaction.status
                    )}
                    walletAddress={
                      withdrawal.payment_account.account_identifier || undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Vous n'avez effectué aucun retrait pour le moment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
