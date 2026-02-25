"use client";
import React, { useState, useEffect } from 'react';
import { PaymentAccount } from '@/types';
import { useToast } from '@/hooks/use-toast';
import ButtonWithModal from '@/app/components/modal/ButtonWithModal';
import PaymentMethodForm from './forms/PaymentMethodForm';
import ConfirmationModal from '@/app/components/modal/ConfirmationModal';
import { PaymentMethod } from '@prisma/client';
import SectionLoadingSpinner from './SectionLoadingSpinner';

interface PaymentAccountListProps {
  userId: string;
}

const PaymentAccountList: React.FC<PaymentAccountListProps> = ({ userId }) => {
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<PaymentAccount | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchPaymentAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/payment-account/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment accounts');
      }
      
      const data = await response.json();
      setPaymentAccounts(data);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      showError('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPaymentAccounts();
    }
  }, [userId]);

  const handleDelete = async () => {
    if (!accountToDelete) return;

    try {
      setDeleteProcessing(true);
      
      // Vérifier s'il y a d'autres comptes actifs
      const otherActiveAccounts = paymentAccounts.filter(
        account => account.id !== accountToDelete.id && account.is_active
      );

      // Si on supprime le compte par défaut et qu'il y a d'autres comptes,
      // définir le premier autre compte comme nouveau compte par défaut
      if (accountToDelete.is_default && otherActiveAccounts.length > 0) {
        const newDefaultAccount = otherActiveAccounts[0];
        
        // Mettre à jour le nouveau compte par défaut
        const updateResponse = await fetch(`/api/payment-account/update/${newDefaultAccount.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newDefaultAccount,
            is_default: true,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update default account');
        }
      }

      // Supprimer le compte
      const response = await fetch(`/api/user/payment-account/${accountToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment account');
      }

      showSuccess('Compte de paiement supprimé avec succès');
      setDeleteModalOpen(false);
      setAccountToDelete(null);
      fetchPaymentAccounts(); // Recharger la liste
    } catch (error: any) {
      console.error('Error deleting payment account:', error);
      showError(error.message || 'Failed to delete payment account');
    } finally {
      setDeleteProcessing(false);
    }
  };

  const openDeleteModal = (account: PaymentAccount) => {
    setAccountToDelete(account);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  const getTypeDisplay = (type: PaymentMethod) => {
    switch (type) {
      case PaymentMethod.CRYPTO:
        return 'Crypto-monnaie';
      case PaymentMethod.MOBILE:
        return 'Mobile Money';
      default:
        return type;
    }
  };

  const getProviderDisplay = (account: PaymentAccount) => {
    if (account.type === PaymentMethod.CRYPTO && account.crypto_currency) {
      return `${account.provider} - ${account.crypto_currency}`;
    }
    return account.provider;
  };

  // Vérifier si on peut supprimer le compte par défaut
  const canDeleteDefaultAccount = (account: PaymentAccount) => {
    if (!account.is_default) return true;
    
    // Compter les autres comptes actifs
    const otherActiveAccounts = paymentAccounts.filter(
      acc => acc.id !== account.id && acc.is_active
    );
    
    return otherActiveAccounts.length > 0;
  };

  const getDeleteButtonTooltip = (account: PaymentAccount) => {
    if (account.is_default) {
      const otherActiveAccounts = paymentAccounts.filter(
        acc => acc.id !== account.id && acc.is_active
      );
      
      if (otherActiveAccounts.length === 0) {
        return "Impossible de supprimer le seul compte actif";
      }
      
      return `La suppression définira "${otherActiveAccounts[0].provider}" comme compte par défaut`;
    }
    
    return "Supprimer ce compte";
  };

  if (loading) {
    return  <SectionLoadingSpinner/>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mes comptes de paiement</h3>
        <ButtonWithModal
          title="Ajouter un compte"
          button
          content={
            <PaymentMethodForm
              type="create"
              user_id={userId}
              onModalClose={() => {}}
              onSuccess={fetchPaymentAccounts}
            />
          }
          onSuccess={fetchPaymentAccounts}
        />
      </div>

      {paymentAccounts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>Aucun compte de paiement configuré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentAccounts.map((account) => {
            const canDelete = canDeleteDefaultAccount(account);
            const tooltip = getDeleteButtonTooltip(account);
            
            return (
              <div
                key={account.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">
                        {getTypeDisplay(account.type)}
                      </h4>
                      {account.is_default && (
                        <span className="bg-cyan-600 text-white text-xs px-2 py-1 rounded">
                          Par défaut
                        </span>
                      )}
                      {!account.is_active && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                          Inactif
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-1">
                      <span className="font-medium">Provider:</span> {getProviderDisplay(account)}
                    </p>
                    
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Identifiant:</span> {account.account_identifier}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <ButtonWithModal
                      title="Modifier"
                      button={false}
                      content={
                        <PaymentMethodForm
                          type="update"
                          id={account.id}
                          user_id={userId}
                          onModalClose={() => {}}
                          onSuccess={fetchPaymentAccounts}
                        />
                      }
                      onSuccess={fetchPaymentAccounts}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    />
                    
                    <button
                      onClick={() => openDeleteModal(account)}
                      className={`text-red-400 hover:text-red-300 text-sm font-medium ${
                        !canDelete ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!canDelete}
                      title={tooltip}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                
                {account.is_default && !canDelete && (
                  <p className="text-xs text-gray-400 mt-2">
                    Vous ne pouvez pas supprimer votre seul compte actif. Ajoutez un autre compte d'abord.
                  </p>
                )}
                
                {account.is_default && canDelete && (
                  <p className="text-xs text-cyan-400 mt-2">
                    ⚠️ La suppression de ce compte par défaut définira automatiquement un autre compte comme défaut.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Supprimer le compte de paiement"
        message={
          accountToDelete ? (
            <div>
              <p>Êtes-vous sûr de vouloir supprimer ce compte de paiement ?</p>
              <div className="mt-2 p-3 bg-gray-900 rounded text-sm">
                <p><strong>Type:</strong> {getTypeDisplay(accountToDelete.type)}</p>
                <p><strong>Provider:</strong> {getProviderDisplay(accountToDelete)}</p>
                <p><strong>Identifiant:</strong> {accountToDelete.account_identifier}</p>
                
                {accountToDelete.is_default && (
                  <div className="mt-2 p-2 bg-yellow-900 rounded">
                    <p className="text-yellow-300 font-semibold">⚠️ Compte par défaut</p>
                    <p className="text-yellow-200 text-xs mt-1">
                      Un autre compte sera automatiquement défini comme compte par défaut.
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-red-400">Cette action est irréversible.</p>
            </div>
          ) : null
        }
        confirmText={deleteProcessing ? "Suppression..." : "Supprimer"}
        cancelText="Annuler"
        confirmColor="red"
        processing={deleteProcessing}
      />
    </div>
  );
};

export default PaymentAccountList;