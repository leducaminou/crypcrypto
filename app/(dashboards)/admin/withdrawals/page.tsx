"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Roles } from "@/app/lib/auth.config";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import WithdrawalFilters from "@/app/components/ui/admin/WithdrawalFilters";
import ConfirmationModal from "@/app/components/modal/ConfirmationModal";
import { TransactionStatus, TransactionStatusType } from "@/types";
import { getStatusTranslation, getStatusColor } from "@/app/lib/utils";
import ButtonWithModal from "@/app/components/modal/ButtonWithModal";
import WithdrawalDetail from "@/app/components/ui/WithdrawalDetail";
import Button from "@/app/components/ui/Button";

interface Withdrawal {
  id: string;
  user: string;
  userName: string;
  amount: string;
  method: string;
  date: string;
  status: string;
  rawAmount: number;
  createdAt: string;
  userId: string;
  transactionId: string;
}

interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UpdateWithdrawalRequest {
  withdrawalId: string;
  action: "approve" | "reject";
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    withdrawal: {
      id: string;
      status: string;
    };
    transaction: {
      id: string;
      status: string;
    };
  };
  error?: string;
  details?: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatusType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useRoleGuard([Roles.ADMIN]);

  const handleSuccess = () => {
    fetchWithdrawals();
    router.refresh();
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage]);

  useEffect(() => {
    if (selectedStatus === "all") {
      setFilteredWithdrawals(withdrawals);
    } else {
      setFilteredWithdrawals(
        withdrawals.filter((w) => w.status === selectedStatus)
      );
    }
  }, [withdrawals, selectedStatus]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/withdrawal?page=${currentPage}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WithdrawalsResponse = await response.json();

      const formattedWithdrawals = data.withdrawals.map((withdrawal: any) => ({
        ...withdrawal,
        userId: withdrawal.userId || "",
        transactionId: withdrawal.transactionId || "",
      }));

      setWithdrawals(formattedWithdrawals);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      setError("Erreur lors du chargement des retraits");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: TransactionStatusType | "all") => {
    setSelectedStatus(status);
  };

  const openConfirmationModal = (
    withdrawal: Withdrawal,
    action: "approve" | "reject"
  ) => {
    setSelectedWithdrawal(withdrawal);
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWithdrawal(null);
    setSelectedAction(null);
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal || !selectedAction) return;

    try {
      setProcessing(true);

      const updateData: UpdateWithdrawalRequest = {
        withdrawalId: selectedWithdrawal.id,
        action: selectedAction,
      };

      const response = await fetch("/api/withdrawal/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === selectedWithdrawal.id
              ? {
                  ...w,
                  status:
                    selectedAction === "approve" ? TransactionStatus.COMPLETED : TransactionStatus.CANCELLED,
                }
              : w
          )
        );

        closeModal();
      } else {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Failed to update withdrawal:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du retrait"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gestion des retraits</h1>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-700 rounded animate-pulse"
                ></div>
              ))}
            </div>

            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-7 gap-4 py-4 border-b border-gray-700"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-700 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gestion des retraits</h1>
        </div>

        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">
                Erreur de chargement
              </h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <Button
                onClick={fetchWithdrawals}
                variant="danger"
                size="sm"
                className="mt-3"
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestion des retraits</h1>
      </div>

      <WithdrawalFilters
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4 text-sm text-gray-400 font-medium">
            <div>Utilisateur</div>
            <div>Montant</div>
            <div>Méthode</div>
            <div>Date</div>
            <div>Statut</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filteredWithdrawals.length > 0 ? (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="grid grid-cols-1 md:grid-cols-7 gap-4 py-4 border-b border-gray-700 items-center"
                >
                  <div>
                    <div className="font-medium">{withdrawal.userName}</div>
                    <div className="text-sm text-gray-400">
                      {withdrawal.user}
                    </div>
                  </div>

                  <div className="font-semibold">{withdrawal.amount}</div>

                  <div className="capitalize">
                    {withdrawal.method.toLowerCase()}
                  </div>

                  <div className="text-sm text-gray-400">{withdrawal.date}</div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        withdrawal.status as TransactionStatusType
                      )}`}
                    >
                      {getStatusTranslation(
                        withdrawal.status as TransactionStatusType
                      )}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() =>
                          openConfirmationModal(withdrawal, "approve")
                        }
                        disabled={withdrawal.status !== TransactionStatus.PENDING.toLocaleLowerCase()}
                        variant="primary"
                        size="sm"
                        className={`${
                          withdrawal.status === TransactionStatus.PENDING.toLocaleLowerCase()
                            ? "bg-green-600 hover:bg-green-500 from-green-600 to-green-500 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed from-gray-600 to-gray-500"
                        }`}
                      >
                        Approuver
                      </Button>
                      <Button
                        onClick={() =>
                          openConfirmationModal(withdrawal, "reject")
                        }
                        disabled={withdrawal.status !== TransactionStatus.PENDING.toLocaleLowerCase()}
                        variant="danger"
                        size="sm"
                        className={`${
                          withdrawal.status !== TransactionStatus.PENDING.toLocaleLowerCase()
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Rejeter
                      </Button>
                      <div className="flex justify-end">
                        <ButtonWithModal
                          title="Détails"
                          type="create"
                          button
                          size="sm"
                          variant="primary"
                          content={
                            <WithdrawalDetail
                              id={withdrawal.transactionId}
                              onModalClose={() => setIsModalOpen(false)}
                              onSuccess={handleSuccess}
                            />
                          }
                          onSuccess={handleSuccess}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun retrait trouvé</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="border-t border-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="default"
                size="sm"
              >
                Précédent
              </Button>

              <span className="text-sm text-gray-400">
                Page {currentPage} sur {totalPages}
              </span>

              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                variant="default"
                size="sm"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleWithdrawalAction}
        title={
          selectedAction === "approve"
            ? "Confirmer l'approbation"
            : "Confirmer le rejet"
        }
        message={
          selectedWithdrawal && selectedAction
            ? selectedAction === "approve"
              ? `Êtes-vous sûr de vouloir approuver le retrait de ${selectedWithdrawal.amount} ? 
               Le montant sera déduit du wallet PROFIT de l'utilisateur.`
              : `Êtes-vous sûr de vouloir rejeter le retrait de ${selectedWithdrawal.amount} ?`
            : ""
        }
        confirmText={selectedAction === "approve" ? "Approuver" : "Rejeter"}
        cancelText="Annuler"
        confirmColor={selectedAction === "approve" ? "green" : "red"}
        processing={processing}
      />
    </div>
  );
}