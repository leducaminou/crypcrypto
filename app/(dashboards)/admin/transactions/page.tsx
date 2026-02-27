'use client'
import { useState, useEffect } from 'react'
import { Roles } from '@/app/lib/auth.config'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import { TransactionStatus } from '@/types'
import { getStatusTranslation, getStatusColor } from '@/app/lib/utils'
import { Pagination } from '@/app/components/ui/Pagination'
import TransactionFilters from '@/app/components/ui/dashboard/TransactionFilters'
import Button from '@/app/components/ui/Button'

interface Transaction {
  id: string
  user: string
  userName: string
  amount: string
  type: string
  date: string
  status: string
  method: string
}

interface TransactionsResponse {
  transactions: Transaction[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useRoleGuard([Roles.ADMIN])

  useEffect(() => {
    fetchTransactions()
  }, [currentPage])

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredTransactions(transactions)
    } else {
      setFilteredTransactions(
        transactions.filter(t => t.status === selectedStatus)
      )
    }
  }, [transactions, selectedStatus])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/transaction?page=${currentPage}&limit=20`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: TransactionsResponse = await response.json()
      
      setTransactions(data.transactions)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setError('Erreur lors du chargement des transactions')
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
          <h1 className="text-2xl font-bold">Gestion des transactions</h1>
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
          <h1 className="text-2xl font-bold">Gestion des transactions</h1>
        </div>
        
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Erreur de chargement</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <Button 
                onClick={fetchTransactions}
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
        <h1 className="text-2xl font-bold">Gestion des transactions</h1>
      </div>

      <TransactionFilters
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 text-sm text-gray-400 font-medium">
            <div>Utilisateur</div>
            <div>Montant</div>
            <div>Type</div>
            <div>Date</div>
            <div>Statut</div>
            <div>Méthode</div>
          </div>
          
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 py-4 border-b border-gray-700 items-center"
                >
                  <div>
                    <div className="font-medium">{transaction.userName}</div>
                    <div className="text-sm text-gray-400">{transaction.user}</div>
                  </div>
                  
                  <div className="font-semibold">
                    {transaction.amount}
                  </div>
                  
                  <div className="capitalize">
                    {transaction.type.toLowerCase()}
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {transaction.date}
                  </div>
                  
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status as TransactionStatus)}`}>
                       {getStatusTranslation(transaction.status as TransactionStatus)}
                    </span>
                  </div>
                  
                  <div className="capitalize">
                    {transaction.method.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucune transaction trouvée</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-700 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}