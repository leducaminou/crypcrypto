'use client'
import AdminActivityTable from '@/app/components/ui/admin/AdminActivityTable'
import RecentInvestments from '@/app/components/ui/admin/RecentInvestments'
import RecentWithdrawals from '@/app/components/ui/admin/RecentWithdrawals'
import StatsCard from '@/app/components/ui/dashboard/StatsCard'
import { Roles } from '@/app/lib/auth.config'
import { recentActivitiesData, statsData } from '@/app/lib/fakeData'
import { useRoleGuard } from '@/app/lib/utils/role-guard'
import { useEffect, useState } from 'react'
import { AdminStat } from '@/types'
import RecentTransactions from '@/app/components/ui/admin/RecentTransactions'
import { useRouter } from 'next/navigation'
import PerformanceChart from '@/app/components/ui/admin/PerformanceChart'
import Button from '@/app/components/ui/Button'
import ButtonLink from '@/app/components/ui/ButtonLink'

interface Investment {
  id: string
  user: string
  userName: string
  plan: string
  amount: string
  date: string
  status: string
}

interface Withdrawal {
  id: string
  user: string
  userName: string
  amount: string
  method: string
  date: string
  status: string
}

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStat[]>(statsData)
  const [recentInvestments, setRecentInvestments] = useState<Investment[]>([])
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  useRoleGuard([Roles.ADMIN])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch stats
        const statsResponse = await fetch('/api/admin/stats')
        if (!statsResponse.ok) {
          throw new Error(`HTTP error! status: ${statsResponse.status}`)
        }
        const statsData = await statsResponse.json()
        setStats(statsData)

        // Fetch recent investments
        const investmentsResponse = await fetch('/api/investment?limit=4')
        if (!investmentsResponse.ok) {
          throw new Error(`HTTP error! status: ${investmentsResponse.status}`)
        }
        const investmentsData = await investmentsResponse.json()
        
        // Formater correctement les données d'investissement
        const formattedInvestments: Investment[] = investmentsData.investments.map((inv: any) => ({
          id: inv.id,
          user: inv.user.email,
          userName: `${inv.user.first_name || ''} ${inv.user.last_name || ''}`.trim() || inv.user.email,
          plan: inv.plan.name,
          amount: `$${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          date: new Date(inv.createdAt).toLocaleDateString('fr-FR'),
          status: inv.status.toLowerCase()
        }))
        
        setRecentInvestments(formattedInvestments)

        // Fetch recent withdrawals
        const withdrawalsResponse = await fetch('/api/withdrawal?limit=4')
        if (!withdrawalsResponse.ok) {
          throw new Error(`HTTP error! status: ${withdrawalsResponse.status}`)
        }
        const withdrawalsData = await withdrawalsResponse.json()
        
        // Formater correctement les données de retrait
        const formattedWithdrawals: Withdrawal[] = withdrawalsData.withdrawals.map((wd: any) => ({
          id: wd.id,
          user: wd.user,
          userName: wd.userName,
          amount: wd.amount,
          method: wd.method,
          date: wd.date,
          status: wd.status
        }))
        
        setRecentWithdrawals(formattedWithdrawals)

        // Fetch recent transactions
        const transactionsResponse = await fetch('/api/transaction?limit=5')
        if (!transactionsResponse.ok) {
          throw new Error(`HTTP error! status: ${transactionsResponse.status}`)
        }
        const transactionsData = await transactionsResponse.json()
        
        // Formater correctement les données de transaction
        const formattedTransactions: Transaction[] = transactionsData.transactions.map((tx: any) => ({
          id: tx.id,
          user: tx.user,
          userName: tx.userName,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          status: tx.status,
          method: tx.method
        }))
        
        setRecentTransactions(formattedTransactions)

      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        
        {/* Skeleton pour les sections récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="h-80 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg animate-pulse">
                  <div>
                    <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-32"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-600 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((section) => (
            <div key={section} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                <div className="h-8 bg-gray-700 rounded w-20"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg animate-pulse">
                    <div>
                      <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-32"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-600 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Erreur de chargement</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
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
      {/* Section principale des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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

      {/* Graphique de performance et activités */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Graphique de performance */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 lg:col-span-2">
          <PerformanceChart />
        </div>
        
        {/* Transactions récentes */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transactions récentes</h3>
            <ButtonLink 
              href="/admin/transactions"
              variant="link"
              className="!px-0 !py-0"
            >
              Voir tout
            </ButtonLink>
          </div>
          <div className="space-y-4">
            <RecentTransactions transactions={recentTransactions} />
          </div>
        </div>
      </div>

      {/* Derniers investissements et retraits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Derniers investissements */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Derniers investissements</h3>
            <ButtonLink 
              href="/admin/investments"
              variant="link"
              className="!px-0 !py-0"
            >
              Voir tout
            </ButtonLink>
            
          </div>
          <RecentInvestments investments={recentInvestments} />
        </div>
        
        {/* Derniers retraits */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Derniers retraits</h3>
            <ButtonLink 
              href="/admin/withdrawals"
              variant="link"
              className="!px-0 !py-0"
            >
              Voir tout
            </ButtonLink>
          </div>
          <RecentWithdrawals withdrawals={recentWithdrawals} />
        </div>
      </div>
    </div>
  )
}
