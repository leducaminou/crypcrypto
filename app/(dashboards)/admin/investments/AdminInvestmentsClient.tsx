// app/(dashboards)/admin/investments/AdminInvestmentsClient.tsx
'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Investment, InvestmentPlan } from '@/types';
import { formatDate } from '@/app/lib/utils';
import StatsCard from '@/app/components/ui/dashboard/StatsCard';
import { Trash } from 'lucide-react';
import DropdownFilter from '@/app/components/ui/DropdownFilter';
import { periodFilterOptions } from '@/app/lib/constants';
import SearchInput from '@/app/components/ui/SearchInput';
import AdminTable from '@/app/components/ui/admin/AdminTable';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import { useRouter } from 'next/navigation';
import PlanForm from '@/app/components/ui/forms/PlanForm';
import ButtonWithModal from '@/app/components/modal/ButtonWithModal';
import { Pagination } from '@/app/components/ui/Pagination';
import { ITEMS_PER_PAGE } from '@/app/lib/constants';

type Stat = {
  title: string;
  value: string;
  change: string;
  icon: string;
};

type AdminInvestmentsClientProps = {
  initialInvestments: Investment[];
  initialPlans: InvestmentPlan[];
  initialStats: Stat[];
  initialTotalCount: number;
};

export default function AdminInvestmentsClient({
  initialInvestments,
  initialPlans,
  initialStats,
  initialTotalCount,
}: AdminInvestmentsClientProps) {
  const [activeTab, setActiveTab] = useState<'investments' | 'plans'>('investments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<InvestmentPlan | null>(null);
  const [plans, setPlans] = useState<InvestmentPlan[]>(initialPlans);
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchInvestments = useCallback(async (page: number, search: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status })
      });

      const response = await fetch(`/api/investment?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des investissements');

      const data = await response.json();
      setInvestments(data.investments);
      setTotalCount(data.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'investments') {
        fetchInvestments(1, searchTerm, statusFilter);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, activeTab, fetchInvestments]);

  const handlePageChange = (page: number) => {
    fetchInvestments(page, searchTerm, statusFilter);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.dailyProfitPercent.toString().includes(searchTerm)
  );

  const handleSuccess = () => {
    router.refresh();
  };

  async function handleDeletePlan(id: string) {
    try {
      setPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== id));

      const response = await fetch(`/api/investment-plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du plan');
      }

      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      setPlans(initialPlans);
    }
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestion des investissements</h1>
        <div className="flex space-x-4">
          <Button
            variant={activeTab === 'investments' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('investments')}
          >
            Investissements
          </Button>
          <Button
            variant={activeTab === 'plans' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('plans')}
          >
            Plans d'investissement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {initialStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SearchInput
            placeholder={activeTab === 'investments' ? 'Rechercher des investissements...' : 'Rechercher des plans...'}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full md:w-1/2"
          />
          <div className="flex space-x-4">
            {activeTab === 'investments' && (
              <DropdownFilter
                options={periodFilterOptions}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              />
            )}
            {activeTab === 'plans' && (
              <ButtonWithModal
                title="Nouvel plan"
                button
                content={<PlanForm type="create" onModalClose={() => setIsModalOpen(false)} />}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </div>

      {activeTab === 'investments' ? (
        <>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
            <AdminTable
              columns={[
                { header: 'ID', accessor: 'id' },
                {
                  header: 'Utilisateur',
                  cell: (row) => (
                    <span>
                      {(row.user.first_name || row.user.last_name)
                        ? `${row.user.first_name || ''} ${row.user.last_name || ''}`
                        : row.user.email}
                    </span>
                  ),
                },
                {
                  header: 'Plan',
                  cell: (row) => <span>{row.plan.name}</span>,
                },
                { header: 'Montant', accessor: 'amount' },
                {
                  header: 'Date début',
                  cell: (row) => <span>{formatDate(row.startDate)}</span>,
                },
                {
                  header: 'Date fin',
                  cell: (row) => <span>{formatDate(row.endDate)}</span>,
                },
                {
                  header: 'Statut',
                  cell: (row) => (
                    <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>
                      {row.status === 'ACTIVE' ? 'Actif' : row.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                    </Badge>
                  ),
                },
                { header: 'Profit', accessor: 'profitEarned' },
              ]}
              data={investments}
              emptyMessage="Aucun investissement trouvé"
              loading={loading}
            />
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="justify-center"
            />
          )}
        </>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <AdminTable
            columns={[
              { header: 'Nom', accessor: 'name' },
              { 
                header: 'Profit quotidien', 
                cell: (row) => <span>{row.dailyProfitPercent}%</span> 
              },
              { header: 'Durée', accessor: 'durationDays' },
              { 
                header: 'Montant min', 
                cell: (row) => <span>${row.minAmount}</span> 
              },
              { 
                header: 'Montant max', 
                cell: (row) => <span>{row.maxAmount ? `$${row.maxAmount}` : 'Illimité'}</span> 
              },
              {
                header: 'Statut',
                cell: (row) => (
                  <Badge variant={row.isActive ? 'success' : 'default'}>
                    {row.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                cell: (row) => (
                  <div className="flex space-x-2">
                    <ButtonWithModal
                      type="update"
                      content={<PlanForm type="update" id={row.id} onModalClose={() => setIsModalOpen(false)} />}
                      onSuccess={handleSuccess}
                    />
                    <button
                      onClick={() => handleDeletePlan(row.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Supprimer"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredPlans}
            emptyMessage="Aucun plan d'investissement trouvé"
          />
        </div>
      )}
    </div>
  );
}