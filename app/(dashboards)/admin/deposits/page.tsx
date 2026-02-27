// app/(dashboards)/admin/deposits/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Roles } from '@/app/lib/auth.config'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import DepositFilters from '@/app/components/ui/admin/DepositFilters'
import { TransactionStatus } from '@/types'
import { getStatusTranslation, getStatusColor } from '@/app/lib/utils'
import DepositDetail from '@/app/components/ui/DepositDetail'
import ButtonWithModal from '@/app/components/modal/ButtonWithModal'
import Button from '@/app/components/ui/Button'

interface Deposit {
  id: string
  user: string
  userName: string
  amount: string
  method: string
  date: string
  status: string
  rawAmount: number
  createdAt: string
  userId: string
  transactionId: string
  paymentAccount?: {
    type: string
    account_identifier: string
    provider: string
  }
}

interface DepositsResponse {
  deposits: Deposit[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [filteredDeposits, setFilteredDeposits] = useState<Deposit[]>([])
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useRoleGuard([Roles.ADMIN])

  useEffect(() => {
    fetchDeposits()
  }, [currentPage])

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredDeposits(deposits)
    } else {
      setFilteredDeposits(
        deposits.filter(d => d.status === selectedStatus)
      )
    }
  }, [deposits, selectedStatus])

  const handleSuccess = () => {
    fetchDeposits() // Rafraîchir la liste après une action
    router.refresh()
  }

  const fetchDeposits = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/transaction?type=DEPOSIT&page=${currentPage}&limit=20`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Filtrer pour ne garder que les dépôts
      const depositTransactions = data.transactions.filter((t: any) => t.type === 'DEPOSIT')

      const formattedDeposits = depositTransactions.map((deposit: any) => ({
        ...deposit,
        userId: deposit.userId || '',
        transactionId: deposit.id || '',
        method: deposit.method || deposit.type.toLowerCase()
      }))

      setDeposits(formattedDeposits)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch deposits:', error)
      setError('Erreur lors du chargement des dépôts')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: TransactionStatus | 'all') => {
    setSelectedStatus(status)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gestion des dépôts</h1>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-6 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>

            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-4 py-4 border-b border-gray-700">
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <div key={j} className="h-4 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gestion des dépôts</h1>
        </div>

        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Erreur de chargement</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <Button
                onClick={fetchDeposits}
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
    )
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestion des dépôts</h1>
      </div>

      <DepositFilters
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 text-sm text-gray-400 font-medium">
            <div>Utilisateur</div>
            <div>Montant</div>
            <div>Méthode</div>
            <div>Compte</div>
            <div>Date</div>
            <div>Statut</div>
          </div>

          {filteredDeposits.length > 0 ? (
            <div className="space-y-4">
              {filteredDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 py-4 border-b border-gray-700 items-center"
                >
                  <div>
                    <div className="font-medium">{deposit.userName}</div>
                    <div className="text-sm text-gray-400">{deposit.user}</div>
                  </div>

                  <div className="font-semibold">
                    {deposit.amount}
                  </div>

                  <div className="capitalize">
                    {deposit.method.toLowerCase()}
                  </div>

                  <div className="text-sm text-gray-400">
                    {deposit.paymentAccount?.account_identifier || 'N/A'}
                  </div>

                  <div className="text-sm text-gray-400">
                    {deposit.date}
                  </div>

                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status as TransactionStatus)}`}>
                      {getStatusTranslation(deposit.status as TransactionStatus)}
                    </span>
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex justify-end">
                      <ButtonWithModal
                        title="Détails"
                        type="create"
                        button
                        size="sm"
                        variant="primary"
                        content={
                          <DepositDetail
                            id={deposit.transactionId}
                            onModalClose={() => setIsModalOpen(false)}
                            onSuccess={handleSuccess}
                          />
                        }
                        onSuccess={handleSuccess}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun dépôt trouvé</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
    </div>
  )
}