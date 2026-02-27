'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatMonetary } from '@/app/lib/utils';
import { Pagination } from '@/app/components/ui/Pagination';
import { AdminReferralDetails } from '@/types';
import { useRoleGuard } from '@/app/lib/utils/role-guard';
import { Roles } from '@/app/lib/auth.config';
import ButtonLink from '@/app/components/ui/ButtonLink';

const ITEMS_PER_PAGE = 5;

const AdminReferralDetailPage = () => {
  useRoleGuard([Roles.ADMIN]);
  const searchParams = useSearchParams();
  const referralId = searchParams.get('id');

  const [referral, setReferral] = useState<AdminReferralDetails | null>(null);
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBonusesPage, setCurrentBonusesPage] = useState(1);

  useEffect(() => {
    if (!referralId) return;

    const fetchReferralData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/referral/${referralId}`);
        if (!response.ok) throw new Error('Failed to fetch referral details');
        const data = await response.json();
        setReferral(data.referral);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [referralId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const paginatedBonuses = referral?.bonuses.slice(
    (currentBonusesPage - 1) * ITEMS_PER_PAGE,
    currentBonusesPage * ITEMS_PER_PAGE
  ) || [];

  const totalBonusesPages = Math.ceil((referral?.bonuses.length || 0) / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Détails du parrainage</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Détails du parrainage</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="text-red-400 text-center">{error || 'Parrainage non trouvé'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Détails du parrainage</h1>
          <p className="text-gray-400 mt-2">
            {referral.referrer.name} → {referral.referee.name}
          </p>
        </div>
        <ButtonLink 
          href="/admin/referrals" 
          variant="secondary"
          size="sm"
        >
          ← Retour à la liste
        </ButtonLink>
      </div>

      {/* Referral Info Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations du parrain</h3>
            <div className="space-y-2">
              <p><span className="text-gray-400">Nom:</span> {referral.referrer.name}</p>
              <p><span className="text-gray-400">Email:</span> {referral.referrer.email}</p>
              <p><span className="text-gray-400">Téléphone:</span> {referral.referrer.phone}</p>
              <p><span className="text-gray-400">Pays:</span> {referral.referrer.country}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Informations du parrainé</h3>
            <div className="space-y-2">
              <p><span className="text-gray-400">Nom:</span> {referral.referee.name}</p>
              <p><span className="text-gray-400">Email:</span> {referral.referee.email}</p>
              <p><span className="text-gray-400">Téléphone:</span> {referral.referee.phone}</p>
              <p><span className="text-gray-400">Pays:</span> {referral.referee.country}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Détails du parrainage</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-400">Gains totaux:</span> 
              {formatMonetary(referral.earnings.toFixed(2))}$
            </p>
            <p><span className="text-gray-400">Statut:</span> {referral.status}</p>
            <p><span className="text-gray-400">Date d'inscription:</span> {formatDate(referral.signed_up_at)}</p>
            <p><span className="text-gray-400">Premier dépôt:</span> {formatDate(referral.first_deposit_at)}</p>
            <p><span className="text-gray-400">Dernier gain:</span> {formatDate(referral.last_earning_at)}</p>
            <p><span className="text-gray-400">Créé le:</span> {formatDate(referral.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Bonus de parrainage</h2>
        {referral.bonuses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun bonus</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Montant</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Statut de la transaction</th>
                    <th className="pb-3">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBonuses.map((bonus) => (
                    <tr key={bonus.id} className="border-b border-gray-700">
                      <td className="py-3">{formatDate(bonus.created_at)}</td>
                      <td className="py-3 text-green-400">
                        +{formatMonetary(bonus.amount.toFixed(2))}$
                      </td>
                      <td className="py-3">{bonus.description}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bonus.transaction.status === 'COMPLETED' ? 'bg-green-900 text-green-400' :
                          bonus.transaction.status === 'PENDING' ? 'bg-yellow-900 text-yellow-400' :
                          'bg-red-900 text-red-400'
                        }`}>
                          {bonus.transaction.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {bonus.transaction.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalBonusesPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentBonusesPage}
                  totalPages={totalBonusesPages}
                  onPageChange={setCurrentBonusesPage}
                  className="justify-center"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReferralDetailPage;