// app/components/ui/DepositDetail.tsx
'use client'
import React, { useState, useEffect } from 'react'
import ConfirmationModal from '@/app/components/modal/ConfirmationModal'
import { TransactionStatus } from '@/types'
import { getStatusTranslation, getStatusColor, getPaiementMethod } from '@/app/lib/utils'
import Image from 'next/image'

interface TransactionDetail {
  id: string
  reference: string
  payment_id: string | null 
  crypto_currency: string | null
  pay_amount: number | null
  pay_address: string | null
  actually_paid: number | null
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    joinDate: string
  }
  amount: number
  type: string
  status: TransactionStatus
  method: string
  paymentAccount: {
    type: string
    account_identifier: string
    provider: string
  } | null
  walletType: string | null
  walletBalance: number | null
  fee: number
  details: string | null
  proofOfPayment: string | null
  createdAt: string
  processedAt: string | null
  metadata: any
}

interface Props {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  id: string;
}

const DepositDetail = ({ id, onSuccess, onModalClose }: Props) => {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchTransaction()
  }, [id])

  useEffect(() => {
    console.log("transaction", transaction)
  }, [transaction])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/transaction/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setTransaction(data.data)
      } else {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement de la transaction')
    } finally {
      setLoading(false)
    }
  }

  const openConfirmationModal = (action: 'approve' | 'reject') => {
    setSelectedAction(action)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAction(null)
  }

  const handleDepositAction = async () => {
    if (!transaction || !selectedAction) return

    try {
      setProcessing(true)
      
      const response = await fetch(`/api/admin/deposit/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: selectedAction }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        // Rafraîchir les données
        fetchTransaction()
        if (onSuccess) onSuccess()
        closeModal()
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Failed to update deposit:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du dépôt')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Erreur</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Transaction non trouvée</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-h-96 overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6">Détails du dépôt</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Informations de base */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Informations de base</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 text-sm">Référence:</span>
              <p className="text-white font-mono">{transaction.reference}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Montant:</span>
              <p className="text-white font-semibold">
                {formatAmount(transaction.amount)}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Frais:</span>
              <p className="text-white">
                {formatAmount(transaction.fee)}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Statut:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                {getStatusTranslation(transaction.status)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Date de création:</span>
              <p className="text-white">{formatDate(transaction.createdAt)}</p>
            </div>
            {transaction.processedAt && (
              <div>
                <span className="text-gray-400 text-sm">Date de traitement:</span>
                <p className="text-white">{formatDate(transaction.processedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Informations utilisateur</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 text-sm">Email:</span>
              <p className="text-white">{transaction.user.email}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Nom:</span>
              <p className="text-white">
                {transaction.user.firstName} {transaction.user.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Téléphone:</span>
              <p className="text-white">{transaction.user.phone || 'Non renseigné'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Date d'inscription:</span>
              <p className="text-white">{formatDate(transaction.user.joinDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de paiement */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations de paiement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Méthode:</span>
            <p className="text-white capitalize">{transaction.crypto_currency ? "Crypto - "+transaction.crypto_currency :  getPaiementMethod(transaction.method as any) }</p>
          </div>
          {transaction.paymentAccount && (
            <>
              <div>
                <span className="text-gray-400 text-sm">Compte:</span>
                <p className="text-white">{transaction.paymentAccount.account_identifier}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Provider:</span>
                <p className="text-white">{transaction.paymentAccount.provider}</p>
              </div>
            </>
          )}
          {transaction.walletType && (
            <div>
              <span className="text-gray-400 text-sm">Wallet:</span>
              <p className="text-white capitalize">{transaction.walletType.toLowerCase()}</p>
            </div>
          )}
          {transaction.walletBalance !== null && (
            <div>
              <span className="text-gray-400 text-sm">Solde wallet:</span>
              <p className="text-white">
                {formatAmount(transaction.walletBalance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preuve de paiement pour MOBILE */}
      {transaction.method === 'MOBILE' && transaction.proofOfPayment && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Preuve de paiement</h3>
          <div className="flex justify-center">
            <Image
              src={transaction.proofOfPayment}
              alt="Preuve de paiement"
              width={364}
              height={364}
              className="max-w-full h-auto min-h-64 rounded-lg border border-gray-600"
            />
          </div>
        </div>
      )}

      {/* Détails supplémentaires */}
      {transaction.details && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Détails supplémentaires</h3>
          <p className="text-white">{transaction.details}</p>
        </div>
      )}

      {/* Actions */}
      {transaction.status === 'PENDING' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => openConfirmationModal('approve')}
              disabled={processing}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Traitement...' : 'Approuver'}
            </button>
            <button
              onClick={() => openConfirmationModal('reject')}
              disabled={processing}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Traitement...' : 'Rejeter'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDepositAction}
        title={selectedAction === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
        message={
          selectedAction ? (
            selectedAction === 'approve' ? (
              `Êtes-vous sûr de vouloir approuver le dépôt de ${formatAmount(transaction.amount)} ? 
               Le montant sera crédité sur le wallet DEPOSIT de l'utilisateur et les bonus de parrainage seront distribués.`
            ) : (
              `Êtes-vous sûr de vouloir rejeter le dépôt de ${formatAmount(transaction.amount)} ?`
            )
          ) : ''
        }
        confirmText={selectedAction === 'approve' ? 'Approuver' : 'Rejeter'}
        cancelText="Annuler"
        confirmColor={selectedAction === 'approve' ? 'green' : 'red'}
        processing={processing}
      />
    </div>
  )
}

export default DepositDetail