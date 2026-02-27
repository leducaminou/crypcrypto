'use client';

import Table from "@/app/components/ui/table/Table";
import { Pagination } from "@/app/components/ui/Pagination";
import { ITEMS_PER_PAGE } from "@/app/lib/constants";
import { KycVerification, KycStatus } from "@/types";
import React, { useEffect, useState } from "react";
import { useRoleGuard } from "@/app/lib/utils/role-guard";
import { Roles } from "@/app/lib/auth.config";
import KycFilters from "@/app/components/ui/dashboard/KycFilters";
import ButtonWithModal from "@/app/components/modal/ButtonWithModal";
import { useRouter } from "next/navigation";
import KycDetailsForm from "@/app/components/ui/forms/KycDetailsForm";

const columns = [
  {
    header: "Utilisateur",
    accessor: "user",
  },
  {
    header: "Type de document",
    accessor: "document_type",
  },
  {
    header: "Numéro de document",
    accessor: "document_number",
  },
  {
    header: "Statut",
    accessor: "status",
  },
  {
    header: "Date de création",
    accessor: "created_at",
  },
  {
    header: "Action",
    accessor: "action",
  },
];

const AdminKycPage = () => {
  useRoleGuard([Roles.ADMIN]);

  const [kycVerifications, setKycVerifications] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<KycStatus | 'all'>('all');
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  
    const router = useRouter();
  
  const handleSuccess = () => {
    router.refresh();
  };

  useEffect(() => {
    const fetchKycVerifications = async () => {
      try {
        setLoading(true);
        const statusParam = selectedStatus !== 'all' ? `&status=${selectedStatus}` : '';
        const response = await fetch(
          `/api/admin/kyc?page=${currentPage}&limit=${ITEMS_PER_PAGE}${statusParam}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch KYC verifications');
        }
        
        const data = await response.json();
        setKycVerifications(data.kycVerifications);
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
        setTotalItems(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchKycVerifications();
  }, [currentPage, selectedStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (status: KycStatus | 'all') => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };



 
  const formatDocumentType = (type: string) => {
    const types: Record<string, string> = {
      PASSPORT: 'Passeport',
      ID_CARD: "Carte d'identité",
      DRIVER_LICENSE: 'Permis de conduire'
    };
    return types[type] || type;
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-yellow-400',
      APPROVED: 'text-green-400',
      REJECTED: 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const renderRow = (item: KycVerification) => (
    <tr key={item.id} className="text-left text-gray-100 border-b border-gray-700">
      <td className="py-3">
        <div className="flex flex-col">
          <span className="font-medium">{item.user.email}</span>
          {item.user.first_name && item.user.last_name && (
            <span className="text-sm text-gray-400">
              {item.user.first_name} {item.user.last_name}
            </span>
          )}
        </div>
      </td>
      <td className="py-3">{formatDocumentType(item.document_type)}</td>
      <td className="py-3 font-mono text-sm">{item.document_number}</td>
      <td className="py-3">
        <span className={`${getStatusColor(item.status)}`}>
          {formatStatus(item.status)}
        </span>
      </td>
      <td className="py-3">
        {new Date(item.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-3">
       

        <ButtonWithModal
                title="Voir"
                button
                size="sm"
                content={
                <KycDetailsForm type="update" id={item.id} onModalClose={() => setIsKycModalOpen(false)} />}
                onSuccess={handleSuccess}
              />
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-0 text-white mt-28">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Vérifications KYC</h1>
        </div>
        <KycFilters
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
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
          <h1 className="text-2xl font-bold">Vérifications KYC</h1>
        </div>
        <KycFilters
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="text-red-400 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-white mt-28">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Vérifications KYC</h1>
        <div className="text-sm text-gray-400">
          Total: {totalItems} vérification{totalItems !== 1 ? 's' : ''}
        </div>
      </div>

      <KycFilters
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <Table renderRow={renderRow} data={kycVerifications} columns={columns} />
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

export default AdminKycPage;