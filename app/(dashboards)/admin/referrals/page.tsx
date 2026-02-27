'use client';

import Table from "@/app/components/ui/table/Table";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatMonetary } from "@/app/lib/utils";
import { ITEMS_PER_PAGE } from "@/app/lib/constants";
import { AdminReferral } from "@/types";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { Roles } from "@/app/lib/auth.config";
import ReferralFilters from "@/app/components/ui/dashboard/ReferralFilters";
import { ReferralStatus } from "@prisma/client";
import ButtonLink from "@/app/components/ui/ButtonLink";

const columns = [
  {
    header: "Parrain",
    accessor: "referrer",
  },
  {
    header: "Parrainé",
    accessor: "referee",
  },
  {
    header: "Gains",
    accessor: "earnings",
  },
  {
    header: "Statut",
    accessor: "status",
  },
  {
    header: "Inscription",
    accessor: "signed_up_at",
  },
  {
    header: "Action",
    accessor: "action",
  },
];

const AdminReferralsPage = () => {
  useRoleGuard([Roles.ADMIN]);

  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<ReferralStatus | 'all'>('all');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        let url = `/api/admin/referral?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
        if (selectedStatus !== 'all') {
          url += `&status=${selectedStatus}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch referrals');
        }
        const data = await response.json();
        setReferrals(data.referrals);
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
        setTotalItems(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [currentPage, selectedStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (status: ReferralStatus | 'all') => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset à page 1 lors du filtre
  };

  const renderRow = (item: AdminReferral) => (
    <tr key={item.id} className="text-left text-gray-100 border-b border-gray-700">
      <td className="py-3 font-mono text-sm">
        <div className="flex flex-col gap-0">
          <Link href={`/admin/referrals/referral?id=${item.id}`} className="hover:text-gray-400">
            {item.referrer_name}
          </Link>
          <div className="text-xs text-gray-400">
            {item.referrer_email}
          </div>
        </div>
      </td>
      <td className="py-3 font-mono text-sm">
        <div className="flex flex-col gap-0">
          <Link href={`/admin/referrals/referral?id=${item.id}`} className="hover:text-gray-400">
            {item.referee_name}
          </Link>
          <div className="text-xs text-gray-400">
            {item.referee_email}
          </div>
        </div>
      </td>
      <td className="py-3">{formatMonetary(item.earnings.toFixed(2))}$</td>
      <td className="py-3">{item.status}</td>
      <td className="py-3">{new Date(item.signed_up_at).toLocaleDateString('fr-FR')}</td>
      <td className="py-3">
        <ButtonLink 
          href={`/admin/referrals/referral?id=${item.id}`} 
          variant="primary" 
          size="sm"
        >
          Voir
        </ButtonLink>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Liste des parrainages</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Liste des parrainages</h1>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="text-red-400 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Liste des parrainages</h1>
        <div className="text-sm text-gray-400">
          Total: {totalItems} parrainage{totalItems !== 1 ? 's' : ''}
        </div>
      </div>
      
      <ReferralFilters
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <Table renderRow={renderRow} data={referrals} columns={columns} />
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="justify-center"
          />
        </div>
      )}
    </div>
  );
};

export default AdminReferralsPage;