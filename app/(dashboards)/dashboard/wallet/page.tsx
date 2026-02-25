'use client'

import { useState, useEffect, useCallback } from 'react'
import {  PaymentMethod, UserResponse } from '@/types'
import ButtonWithModal from '@/app/components/modal/ButtonWithModal'
import { useRouter } from 'next/navigation'
import LoadingSpiner from '@/app/components/ui/PageLoadingSpiner'
import { formatMonetary, getPaiementMethod, getStatusColor, getStatusTranslation, getTransactionTypeTranslation } from '@/app/lib/utils'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import { useIdContext } from '@/app/components/wrapper/ClientWrapper'
import { Roles } from '@/app/lib/auth.config'
import { useToast } from '@/hooks/use-toast'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { Pagination } from '@/app/components/ui/Pagination'
import { ITEMS_PER_PAGE } from '@/app/lib/constants'
import { ApiPaymentAccount, WalletResponse } from '../withdrawals/page'
import StatsCard from '@/app/components/ui/dashboard/StatsCard'
import CryptoCheckout from '@/app/components/ui/CryptoCheckout'
import ChoiceWalletChoiceButtons from '@/app/components/ui/forms/WalletChoiceButton'
import SectionError from '@/app/components/ui/SectionError'
import SectionLoadingSpinner from '@/app/components/ui/SectionLoadingSpinner'

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
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


export default function WalletPage() {
  useRoleGuard([Roles.USER]);
  const id = useIdContext();
  const router = useRouter();

  
  const { showError } = useToast();

  const [transactions, setTransactions] = useState<TransactionResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profitWallet, setProfitWallet] = useState<WalletResponse | null>(null);
  const [bonusWallet, setBonusWallet] = useState<WalletResponse | null>(null);
    const [paymentAccounts, setPaymentAccounts] = useState<ApiPaymentAccount[]>([]);
      const [user, setUser] = useState<UserResponse | null>(null);

  
  const handleSuccess = () => {
    router.refresh();
  };



  useEffect(() => {
   
    const fetchTransactions = async () => {
      try {
        if (!id) throw new Error('User ID is not available');

        const response = await fetch(`/api/user/transactions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data: TransactionResponse[] = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        showError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

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
        showError(errorMessage);
      }
    };

    const fetchProfitWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError('Invalid user ID');
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
            throw new Error(`Failed to fetch profit wallet: ${walletResponse.status}`);
          }
        } else {
          const walletData: WalletResponse = await walletResponse.json();
          setProfitWallet(walletData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchBonusWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError('Invalid user ID');
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
            throw new Error(`Failed to fetch Bonus wallet: ${walletResponse.status}`);
          }
        } else {
          const walletData: WalletResponse = await walletResponse.json();
          setBonusWallet(walletData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchWallet = async () => {
      if (!id || isNaN(Number(id))) {
        setError('Invalid user ID');
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
        console.error('Error fetching deposit data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      await Promise.all([
        fetchTransactions(),
        fetchUser(),
        fetchWallet(),
        fetchProfitWallet(),
        fetchBonusWallet(),
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

  useEffect(() => {
    }, [user]);

  const stats = [
    { 
      title: "Solde total", 
      value: `$${  
        formatMonetary((Number(wallet?.balance || 0) + Number(profitWallet?.balance || 0)).toFixed(2).toString()) 
      }`, 
      change: "+5.2%", 
      icon: "💰" 
    },
    { 
      title: "Portefeuille", 
      value: `$${wallet?.balance ? formatMonetary(wallet?.balance) : '0.00'}`, 
      change: "+12.7%", 
      icon: "📈" 
    },
    { 
      title: "Profits", 
      value: `$${profitWallet?.balance ? formatMonetary(profitWallet?.balance) : '0.00'}`, 
      change: "+12.7%", 
      icon: "📈" 
    },
    { 
      title: "Bonus", 
      value: `$${profitWallet?.balance ? formatMonetary(profitWallet?.balance) : '0.00'}`, 
      change: "+12.7%", 
      icon: "📈" 
    },
    
  ]


  // Calcul des données paginées
  const paginatedTransactions = transactions
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    ?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPages = transactions ? Math.ceil(transactions.length / ITEMS_PER_PAGE) : 0;

   if (loading) return <SectionLoadingSpinner />

  if (error) return <SectionError error={error} />;
  
  
 

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      {/* En-tête avec solde et bouton de paiement */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mon portefeuille</h1>

        
         {
              wallet &&
              <ButtonWithModal
                title="Ajouter des fonds"
                button
                content={<ChoiceWalletChoiceButtons
                  wallet={wallet}
                  type="create"
                  user_id={id}
                  onModalClose={() => setIsModalOpen(false)} />}
                onSuccess={handleSuccess}
              />
            }
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-6">Historique des transactions</h2>
        
        {error ? (
          <div className="text-center py-12 text-red-400">
            {error}
          </div>
        ) : paginatedTransactions && paginatedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-700 text-sm">
                      <td className="py-3">{formatDate(tx.created_at)}</td>
                      <td>{getTransactionTypeTranslation(tx.type)}</td>
                      <td className={tx.type === 'DIVIDEND' || tx.type === 'REFERRAL' ? 'text-green-400' : ''}>
                        {formatMonetary(Number(tx.amount).toFixed(2).toString())}$
                      </td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs  ${
                            getStatusColor(tx.status)}`}
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-4"
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Aucune transaction disponible
          </div>
        )}
      </div>
    </div>
  )
}