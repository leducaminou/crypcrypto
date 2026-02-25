// app\(dashboards)\dashboard\history\page.tsx
'use client'
import { useState, useEffect } from 'react'

import { Transaction, TransactionType, TransactionStatus, UserResponse } from '@/types'
import HistoryFilters from '@/app/components/ui/dashboard/HistoryFilters'
import TransactionCard from '@/app/components/ui/dashboard/TransactionCard'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import { Roles } from '@/app/lib/auth.config'
import { useIdContext } from '@/app/components/wrapper/ClientWrapper'
import LoadingSpiner from '@/app/components/ui/LoadingSpiner'
import SectionLoadingSpinner from '@/app/components/ui/SectionLoadingSpinner'
import SectionError from '@/app/components/ui/SectionError'

interface ApiTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  created_at: string;
  reference: string | null;
  details: string | null;
}

export default function HistoryPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();

  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/transactions/${id}`)

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des transactions')
        }

        const data: ApiTransaction[] = await response.json()

        const formattedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          date: new Date(tx.created_at).toLocaleDateString('fr-FR'),
          status: tx.status,
          reference: tx.reference || undefined,
          details: tx.details || undefined
        }))

        setTransactions(formattedTransactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [id])



  useEffect(() => {

    const fetchUser = async () => {
      try {
        if (!id) {
          throw new Error('User ID is not available');
        }
        const response = await fetch(`/api/user/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            response.status === 404 ? 'User not found' : `Failed to fetch user: ${errorText}`
          );
        }

        const data: UserResponse = await response.json();
        setUser(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    };


    const fetchData = async () => {
      await Promise.all([
        fetchUser(),
      ]);
      setLoading(false);
    };

    if (id) {
      fetchData();
    } else {
      setError('User ID is not available');
      setLoading(false);
    }
  }, [id]);


  if (!user) return <SectionLoadingSpinner />

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = selectedType === 'all' || transaction.type === selectedType
    const statusMatch = selectedStatus === 'all' || transaction.status === selectedStatus
    return typeMatch && statusMatch
  })


  if (loading) return <SectionLoadingSpinner />

  if (error) return <SectionError error={error} />;
  
  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Historique des transactions</h1>
      </div>

      <HistoryFilters
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
      />

      {filteredTransactions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTransactions.map(transaction => (
            <TransactionCard key={transaction.id} transaction={transaction}/>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">Aucune transaction trouvée avec ces filtres</p>
        </div>
      )}
    </div>
  )
}