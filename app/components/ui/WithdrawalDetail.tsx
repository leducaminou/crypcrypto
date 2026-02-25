// app/components/ui/WithdrawalDetail.tsx
'use client'
import React, { useState, useEffect } from 'react'
import ConfirmationModal from '@/app/components/modal/ConfirmationModal'
import { TransactionStatus } from '@/types'
import { getStatusTranslation, getStatusColor, getPaiementMethod } from '@/app/lib/utils'

interface WithdrawalDetail {
  id: string
  transaction_id: string
  user_id: string
  payment_account_id: string | null
  payment_method: string | null
  rejection_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  transaction: {
    id: string
    user_id: string
    wallet_id: string
    payment_account_id: string | null
    txid: string | null
    type: string
    status: TransactionStatus
    amount: string
    fee: string
    wallet_address: string | null
    reference: string
    details: string | null
    metadata: any | null
    processed_at: string | null
    created_at: string
    updated_at: string
  }
  payment_account?: {
    type: string
    account_identifier: string
    provider: string
  } | null
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    joinDate: string
  }
}

interface Props {
  onModalClose?: () => void;
  onSuccess?: (data?: any) => void;
  id: string;
}

const WithdrawalDetail = ({ id, onSuccess, onModalClose }: Props) => {
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchWithdrawal()
  }, [id])

  const fetchWithdrawal = async () => {
    try {
      setLoading(true)
      setError(null)
     
      const response = await fetch(`/api/withdrawal/${id}`)
     
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
     
      if (data.success) {
        setWithdrawal(data.data)
      } else {
        const errorMsg = data.error || data.message || 'Erreur lors du chargement du retrait'
        console.error('API response error:', data) // Log pour debug
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement du retrait')
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

  const handleWithdrawalAction = async () => {
    if (!withdrawal || !selectedAction) return
    try {
      setProcessing(true)
     
      const response = await fetch(`/api/withdrawal/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action: selectedAction
        }),
      })
      const result = await response.json()
     
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }
      if (result.success) {
        // Rafraîchir les données
        fetchWithdrawal()
        if (onSuccess) onSuccess()
        closeModal()
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Failed to update withdrawal:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du retrait')
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

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount)
    return `${numAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$`
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

  if (!withdrawal) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Retrait non trouvé</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-h-96 overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6">Détails du retrait</h2>
     
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Informations de base */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Informations de base</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 text-sm">Référence:</span>
              <p className="text-white font-mono">{withdrawal.transaction.reference}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Montant:</span>
              <p className="text-white font-semibold">
                {formatAmount(withdrawal.transaction.amount)}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Frais:</span>
              <p className="text-white">
                {formatAmount(withdrawal.transaction.fee)}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Statut:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.transaction.status)}`}>
                {getStatusTranslation(withdrawal.transaction.status)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Date de création:</span>
              <p className="text-white">{formatDate(withdrawal.created_at)}</p>
            </div>
            {withdrawal.transaction.processed_at && (
              <div>
                <span className="text-gray-400 text-sm">Date de traitement:</span>
                <p className="text-white">{formatDate(withdrawal.transaction.processed_at)}</p>
              </div>
            )}
            {withdrawal.approved_at && (
              <div>
                <span className="text-gray-400 text-sm">Date d'approbation:</span>
                <p className="text-white">{formatDate(withdrawal.approved_at)}</p>
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
              <p className="text-white">{withdrawal.user.email}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Nom:</span>
              <p className="text-white">
                {withdrawal.user.firstName} {withdrawal.user.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Téléphone:</span>
              <p className="text-white">{withdrawal.user.phone || 'Non renseigné'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Date d'inscription:</span>
              <p className="text-white">{formatDate(withdrawal.user.joinDate)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Informations de paiement */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations de paiement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {withdrawal.payment_account && (
            <>
              <div>
                <span className="text-gray-400 text-sm">Méthode:</span>
                <p className="text-white capitalize">{getPaiementMethod(withdrawal.payment_account.type as any)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Compte:</span>
                <p className="text-white">{withdrawal.payment_account.account_identifier}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Provider:</span>
                <p className="text-white">{withdrawal.payment_account.provider}</p>
              </div>
            </>
          )}
          {!withdrawal.payment_account && (
            <div className="col-span-2">
              <span className="text-gray-400 text-sm">Aucun compte de paiement associé</span>
            </div>
          )}
        </div>
      </div>
      {/* Raison du rejet */}
      {withdrawal.rejection_reason && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Raison du rejet</h3>
          <p className="text-white">{withdrawal.rejection_reason}</p>
        </div>
      )}
      {/* Détails supplémentaires */}
      {withdrawal.transaction.details && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Détails supplémentaires</h3>
          <p className="text-white">{withdrawal.transaction.details}</p>
        </div>
      )}
      {/* Actions */}
      {withdrawal.transaction.status === 'PENDING' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => openConfirmationModal('approve')}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm"
            >
              Approuver
            </button>
            <button
              onClick={() => openConfirmationModal('reject')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm"
            >
              Rejeter
            </button>
          </div>
        </div>
      )}
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleWithdrawalAction}
        title={selectedAction === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
        message={
          selectedAction ? (
            selectedAction === 'approve' ? (
              `Êtes-vous sûr de vouloir approuver le retrait de ${formatAmount(withdrawal.transaction.amount)} ?
               Le montant sera débité du wallet PROFIT de l'utilisateur.`
            ) : (
              `Êtes-vous sûr de vouloir rejeter le retrait de ${formatAmount(withdrawal.transaction.amount)} ?`
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

export default WithdrawalDetail