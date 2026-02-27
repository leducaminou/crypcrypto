'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatMonetary } from '@/app/lib/utils';
import { Pagination } from '@/app/components/ui/Pagination';
import ButtonLink from '@/app/components/ui/ButtonLink';
import { 
  AdminUserWithStats, 
  UserResponse, 
  InvestmentResponse, 
  TransactionResponse, 
  ReferralStats,
  WalletResponse 
} from '@/types';
import { useRoleGuard } from '@/app/lib/utils/role-guard';
import { Roles } from '@/app/lib/auth.config';

interface PaymentAccount {
  id: string;
  type: string;
  account_identifier: string;
  provider: string;
  is_default: boolean;
}

interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  created_at: string;
  payment_method: string | null;
}

const ITEMS_PER_PAGE = 5;

const AdminUserDetailPage = () => {
    
      useRoleGuard([Roles.ADMIN])
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const [user, setUser] = useState<AdminUserWithStats | null>(null);
  const [userDetails, setUserDetails] = useState<UserResponse | null>(null);
  const [investments, setInvestments] = useState<InvestmentResponse[]>([]);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [depositWallet, setDepositWallet] = useState<WalletResponse | null>(null);
  const [profitWallet, setProfitWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTransactionsPage, setCurrentTransactionsPage] = useState(1);
  const [currentInvestmentsPage, setCurrentInvestmentsPage] = useState(1);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user basic info
        const userResponse = await fetch(`/api/admin/users?user_id=${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();
        setUser(userData.users.find((u: AdminUserWithStats) => u.id === userId) || null);

        // Fetch detailed user info
        const userDetailsResponse = await fetch(`/api/user/${userId}`);
        if (!userDetailsResponse.ok) throw new Error('Failed to fetch user details');
        const userDetailsData = await userDetailsResponse.json();
        setUserDetails(userDetailsData);

        // Fetch investments
        const investmentsResponse = await fetch(`/api/user/investment/${userId}`);
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          setInvestments(investmentsData);
        }

        // Fetch transactions
        const transactionsResponse = await fetch(`/api/user/transactions/${userId}`);
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        }

        // Fetch payment accounts
        const paymentAccountsResponse = await fetch(`/api/user/payment-account/${userId}`);
        if (paymentAccountsResponse.ok) {
          const paymentAccountsData = await paymentAccountsResponse.json();
          setPaymentAccounts(paymentAccountsData);
        }

        // Fetch withdrawals
        const withdrawalsResponse = await fetch(`/api/user/withdrawals/${userId}`);
        if (withdrawalsResponse.ok) {
          const withdrawalsData = await withdrawalsResponse.json();
          setWithdrawals(withdrawalsData.map((w: any) => ({
            id: w.id,
            amount: w.transaction.amount,
            status: w.transaction.status,
            created_at: w.created_at,
            payment_method: w.payment_method
          })));
        }

        // Fetch wallets
        const depositWalletResponse = await fetch(`/api/user/wallet/${userId}`);
        if (depositWalletResponse.ok) {
          const depositWalletData = await depositWalletResponse.json();
          setDepositWallet(depositWalletData);
        }

        const profitWalletResponse = await fetch(`/api/user/wallet/profit/${userId}`);
        if (profitWalletResponse.ok) {
          const profitWalletData = await profitWalletResponse.json();
          setProfitWallet(profitWalletData);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  

  const stats = [
    { 
      title: "Investissement total", 
      value: `${formatMonetary(user?.investment.toFixed(2) || '0.00')}$`,
      icon: "💰"
    },
    { 
      title: "Profit total", 
      value: `${formatMonetary(user?.profit.toFixed(2) || '0.00')}$`,
      icon: "📈"
    },
    { 
      title: "Solde total", 
      value: `${formatMonetary(user?.balance.toFixed(2) || '0.00')}$`,
      icon: "💼"
    },
    { 
      title: "Parrainés", 
      value: user?.referree?.toString() || '0',
      icon: "👥"
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.type === 'WITHDRAWAL' || tx.type === 'DEPOSIT'
  );

  const paginatedTransactions = filteredTransactions.slice(
    (currentTransactionsPage - 1) * ITEMS_PER_PAGE,
    currentTransactionsPage * ITEMS_PER_PAGE
  );

  const paginatedInvestments = investments.slice(
    (currentInvestmentsPage - 1) * ITEMS_PER_PAGE,
    currentInvestmentsPage * ITEMS_PER_PAGE
  );

  const totalTransactionPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const totalInvestmentPages = Math.ceil(investments.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="text-red-400 text-center">{error || 'Utilisateur non trouvé'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
          <p className="text-gray-400 mt-2">
            {user.last_name && user.first_name 
              ? `${user.last_name} ${user.first_name}` 
              : 'Nom non renseigné'}
          </p>
        </div>
        <ButtonLink 
          href="/admin/users" 
          variant="secondary"
          size="sm"
        >
          ← Retour à la liste
        </ButtonLink>
      </div>

      {/* User Info Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
            <div className="space-y-2">
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
              <p><span className="text-gray-400">Téléphone:</span> {user.phone || 'Non renseigné'}</p>
              <p><span className="text-gray-400">Pays:</span> {user.country?.name || 'Non renseigné'}</p>
              <p><span className="text-gray-400">Code de parrainage:</span> {user.referral_code}</p>
              <p><span className="text-gray-400">Parrainé par:</span> {user.referred_by_name || 'Aucun'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Statut du compte</h3>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Email vérifié:</span> 
                <span className={user.is_email_verified ? 'text-green-400' : 'text-red-400'}>
                  {user.is_email_verified ? ' Oui' : ' Non'}
                </span>
              </p>
              <p>
                <span className="text-gray-400">Compte actif:</span> 
                <span className={user.is_active ? 'text-green-400' : 'text-red-400'}>
                  {user.is_active ? ' Oui' : ' Non'}
                </span>
              </p>
              <p>
                <span className="text-gray-400">Compte verrouillé:</span> 
                <span className={user.is_locked ? 'text-red-400' : 'text-green-400'}>
                  {user.is_locked ? ' Oui' : ' Non'}
                </span>
              </p>
              <p><span className="text-gray-400">Dernière connexion:</span> {user.last_login_at ? formatDate(user.last_login_at) : 'Jamais'}</p>
              <p><span className="text-gray-400">Date de création:</span> {formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallets */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Portefeuilles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Portefeuille Principal</h3>
            <p className="text-2xl font-bold text-cyan-400">
              {formatMonetary(depositWallet?.balance || '0')}$
            </p>
            <p className="text-sm text-gray-400 mt-2">Solde disponible</p>
            <p className="text-sm">
              Solde bloqué: {formatMonetary(depositWallet?.locked_balance || '0')}$
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Portefeuille de Profit</h3>
            <p className="text-2xl font-bold text-green-400">
              {formatMonetary(profitWallet?.balance || '0')}$
            </p>
            <p className="text-sm text-gray-400 mt-2">Gains cumulés</p>
            <p className="text-sm">
              Solde bloqué: {formatMonetary(profitWallet?.locked_balance || '0')}$
            </p>
          </div>
        </div>
      </div>

      {/* Payment Accounts */}
      {paymentAccounts.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Comptes de paiement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentAccounts.map((account) => (
              <div key={account.id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{account.provider}</h3>
                <p className="text-sm text-gray-400">{account.type}</p>
                <p className="text-sm break-all">{account.account_identifier}</p>
                {account.is_default && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-900 text-green-400 text-xs rounded-full">
                    Par défaut
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investments */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Investissements</h2>
        {investments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun investissement</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Profit attendu</th>
                    <th className="pb-3">Profit gagné</th>
                    <th className="pb-3">Début</th>
                    <th className="pb-3">Fin</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvestments.map((investment) => (
                    <tr key={investment.id} className="border-b border-gray-700">
                      <td className="py-3">{investment.plan.name}</td>
                      <td className="py-3">
                        {formatMonetary(investment.amount)}$
                      </td>
                      <td className="py-3">
                        {formatMonetary(investment.expected_profit)}$
                      </td>
                      <td className="py-3">
                        {formatMonetary(investment.profit_earned)}$
                      </td>
                      <td className="py-3">{formatDate(investment.start_date)}</td>
                      <td className="py-3">{formatDate(investment.end_date)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          investment.status === 'ACTIVE' ? 'bg-green-900 text-green-400' :
                          investment.status === 'COMPLETED' ? 'bg-blue-900 text-blue-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {investment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalInvestmentPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentInvestmentsPage}
                  totalPages={totalInvestmentPages}
                  onPageChange={setCurrentInvestmentsPage}
                  className="justify-center"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Transactions récentes</h2>
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune transaction</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-700">
                      <td className="py-3">{formatDate(transaction.created_at)}</td>
                      <td className="py-3">
                        {transaction.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
                      </td>
                      <td className={`py-3 ${
                        transaction.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'DEPOSIT' ? '+' : '-'}
                        {formatMonetary(transaction.amount)}$
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'COMPLETED' ? 'bg-green-900 text-green-400' :
                          transaction.status === 'PENDING' ? 'bg-yellow-900 text-yellow-400' :
                          'bg-red-900 text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {transaction.reference || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalTransactionPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentTransactionsPage}
                  totalPages={totalTransactionPages}
                  onPageChange={setCurrentTransactionsPage}
                  className="justify-center"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Withdrawals */}
      {withdrawals.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Demandes de retrait</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Montant</th>
                  <th className="pb-3">Méthode</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-700">
                    <td className="py-3">{formatDate(withdrawal.created_at)}</td>
                    <td className="py-3 text-red-400">
                      -{formatMonetary(withdrawal.amount)}$
                    </td>
                    <td className="py-3">{withdrawal.payment_method || 'N/A'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        withdrawal.status === 'COMPLETED' ? 'bg-green-900 text-green-400' :
                        withdrawal.status === 'PENDING' ? 'bg-yellow-900 text-yellow-400' :
                        'bg-red-900 text-red-400'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referral Stats */}
      {userDetails?.referralStats && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6">Statistiques de parrainage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total parrainés</p>
              <p className="text-2xl font-bold">{userDetails.referralStats.totalReferrals}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Parrainés actifs</p>
              <p className="text-2xl font-bold">{userDetails.referralStats.activeReferrals}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Gains totaux</p>
              <p className="text-2xl font-bold">
                {formatMonetary(Number(userDetails.referralStats.totalEarned).toFixed(2))}$
              </p>
            </div>
            {/* <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Gains en attente</p>
              <p className="text-2xl font-bold">
                {formatMonetary(Number(userDetails.referralStats.pendingRewards).toFixed(2))}$
              </p>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;