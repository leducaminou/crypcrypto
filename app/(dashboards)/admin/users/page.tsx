'use client';

import Table from "@/app/components/ui/table/Table";
import { Pagination } from "@/app/components/ui/Pagination";
import { formatMonetary } from "@/app/lib/utils";
import { ITEMS_PER_PAGE } from "@/app/lib/constants";
import { AdminUserWithStats } from "@/types";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { Roles } from "@/app/lib/auth.config";
import ButtonLink from "@/app/components/ui/ButtonLink";

const columns = [
  {
    header: "Nom & prénom",
    accessor: "name",
  },
  {
    header: "Parrainé par",
    accessor: "referred_by",
  },
  {
    header: "Investissement",
    accessor: "investment",
  },
  {
    header: "Profit",
    accessor: "profit",
  },
  {
    header: "Portefeuille 1",
    accessor: "Wallet_1",
  },
  {
    header: "Portefeuille 2",
    accessor: "Wallet_2",
  },
  {
    header: "Solde",
    accessor: "balance",
  },
  {
    header: "Parrainage",
    accessor: "referree",
  },
  {
    header: "Gain Parrainés",
    accessor: "referree_profit",
  },
  {
    header: "Action",
    accessor: "action",
  },
];

const AdminUsersPage = () => {
  
        useRoleGuard([Roles.ADMIN])

  const [users, setUsers] = useState<AdminUserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
        setTotalItems(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderRow = (item: AdminUserWithStats) => (
    <tr key={item.id} className="text-left text-gray-100 border-b border-gray-700">
      <td className="py-3 font-mono text-sm">
        <div  className="flex flex-col gap-0">
          <Link href={`/admin/users/user?id=${item.id}`} className="hover:text-gray-400">
            {item.last_name && item.first_name
              ? `${item.last_name} ${item.first_name}`
              : 'Non renseigné'}
          </Link>
          <div className="flex flex-col gap-0 text-xs text-gray-400">
            <Link href={`/admin/users/user?id=${item.id}`} className="hover:text-gray-200">{item.email}</Link>
            <Link href={`/admin/users/user?id=${item.id}`} className="hover:text-gray-200">{item.phone || 'Non renseigné'}</Link>
          </div>
        </div>
      </td>

      <td className="py-3">{item.referred_by_name || 'Aucun'}</td>
      <td className="py-3">{formatMonetary(item.investment.toFixed(2))}$</td>
      <td className="py-3">{formatMonetary(item.profit.toFixed(2))}$</td>
      <td className="py-3">{formatMonetary(item.Wallet_1.toFixed(2))}$</td>
      <td className="py-3">{formatMonetary(item.Wallet_2.toFixed(2))}$</td>
      <td className="py-3">{formatMonetary(item.balance.toFixed(2))}$</td>
      <td className="py-3 text-center">{item.referree}</td>
      <td className="py-3">{formatMonetary(item.referree_profit.toFixed(2))}$</td>
      <td className="py-3">
        <ButtonLink 
          href={`/admin/users/user?id=${item.id}`} 
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
          <h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
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
          <h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
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
        <h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
        <div className="text-sm text-gray-400">
          Total: {totalItems} utilisateur{totalItems !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <Table renderRow={renderRow} data={users} columns={columns} />
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

export default AdminUsersPage;